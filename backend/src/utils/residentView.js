/**
 * Visões enxutas dos dados devolvidos ao morador.
 *
 * O morador não precisa (e não deve) receber dados internos de
 * outros usuários (e-mail, telefone, último login do síndico ou
 * do porteiro) nem os hashes da credencial de retirada.
 */

export function publicUser(user) {
  if (!user || typeof user !== "object") {
    return user ?? null;
  }

  return {
    id: user.id,
    name: user.name ?? null,
  };
}

export function residentPackage(packageRecord) {
  if (!packageRecord || typeof packageRecord !== "object") {
    return packageRecord;
  }

  const rest = { ...packageRecord };
  delete rest.pickupTokenHash;
  delete rest.pickupCodeHash;

  for (const key of ["receivedBy", "deliveredBy"]) {
    if (key in rest) {
      rest[key] = publicUser(rest[key]);
    }
  }

  if (rest.expectedByResident?.user) {
    rest.expectedByResident = {
      ...rest.expectedByResident,
      user: publicUser(rest.expectedByResident.user),
    };
  }

  return rest;
}

export function residentReservation(reservation) {
  if (!reservation || typeof reservation !== "object") {
    return reservation;
  }

  const rest = { ...reservation };

  for (const key of ["requestedBy", "reviewedBy", "canceledBy", "cancelledBy"]) {
    if (key in rest) {
      rest[key] = publicUser(rest[key]);
    }
  }

  return rest;
}

/**
 * Troca, em qualquer nível, objetos de usuário (que têm "username")
 * por { id, name }. Usado em visitantes e avisos, que trazem
 * quem registrou, autorizou, convidou ou publicou.
 */
export function stripUsers(value, depth = 0) {
  if (Array.isArray(value)) {
    return value.map((item) => stripUsers(item, depth + 1));
  }

  if (!value || typeof value !== "object" || value instanceof Date) {
    return value;
  }

  if (depth > 0 && "username" in value) {
    return publicUser(value);
  }

  if (depth > 4) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      stripUsers(item, depth + 1),
    ])
  );
}

export function residentVisitor(visitor) {
  return stripUsers(visitor);
}

export function residentNotice(notice) {
  return stripUsers(notice);
}

/**
 * Aplica a visão somente quando quem pede é morador.
 */
export function forResident(user, mapper, data) {
  if (user?.role !== "RESIDENT") {
    return data;
  }

  return Array.isArray(data)
    ? data.map(mapper)
    : mapper(data);
}

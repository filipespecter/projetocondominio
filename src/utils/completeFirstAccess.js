// A troca revoga as sessões antigas no servidor. Só prossiga com uma sessão nova.
export async function completeFirstAccess(auth, data) {
  await auth.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword, newPasswordConfirmation: data.newPasswordConfirmation });
  try {
    await auth.login({ portalType: data.portalType, username: data.username, password: data.newPassword });
    return await auth.me();
  } catch (cause) {
    const error = new Error("Senha alterada; novo login necessário.", { cause });
    error.passwordChanged = true;
    throw error;
  }
}

import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

class SearchController {
  async index(req, res, next) {
    try {
      const condominiumId = req.user?.condominiumId;
      const q = String(req.query.q ?? "").trim();
      if (!condominiumId) throw new ApiError("Condomínio não identificado.", 403);
      if (q.length < 2) return res.status(200).json({ success: true, data: { apartments: [], residents: [], visitors: [], packages: [], occurrences: [] } });

      const [apartments, residents, visitors, packages, occurrences] = await Promise.all([
        prisma.apartment.findMany({ where: { condominiumId, deletedAt: null, OR: [{ number: { contains: q, mode: "insensitive" } }, { block: { contains: q, mode: "insensitive" } }] }, select: { id: true, block: true, number: true, status: true }, take: 8 }),
        prisma.resident.findMany({ where: { condominiumId, deletedAt: null, user: { OR: [{ name: { contains: q, mode: "insensitive" } }, { username: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } }, include: { user: { select: { id: true, name: true, username: true, email: true } }, apartment: { select: { id: true, block: true, number: true } } }, take: 8 }),
        prisma.visitor.findMany({ where: { condominiumId, deletedAt: null, OR: [{ name: { contains: q, mode: "insensitive" } }, { document: { contains: q } }, { plate: { contains: q, mode: "insensitive" } }] }, include: { apartment: { select: { id: true, block: true, number: true } } }, take: 8, orderBy: { createdAt: "desc" } }),
        prisma.package.findMany({ where: { condominiumId, deletedAt: null, OR: [{ description: { contains: q, mode: "insensitive" } }, { trackingCode: { contains: q, mode: "insensitive" } }, { withdrawnBy: { contains: q, mode: "insensitive" } }, { apartment: { number: { contains: q, mode: "insensitive" } } }] }, include: { apartment: { select: { id: true, block: true, number: true } } }, take: 8, orderBy: { createdAt: "desc" } }),
        prisma.occurrence.findMany({ where: { condominiumId, deletedAt: null, OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { category: { contains: q, mode: "insensitive" } }] }, select: { id: true, title: true, category: true, status: true, priority: true, apartmentId: true, createdAt: true }, take: 8, orderBy: { createdAt: "desc" } }),
      ]);
      return res.status(200).json({ success: true, message: "Busca concluída.", data: { apartments, residents, visitors, packages, occurrences } });
    } catch (error) { return next(error); }
  }
}
export default new SearchController();

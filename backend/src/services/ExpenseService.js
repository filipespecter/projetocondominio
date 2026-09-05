import prisma from "../config/prisma.js";
import AuditLogService from "./AuditLogService.js";
import { ApiError } from "../utils/ApiError.js";
import { saveImageDataUrl, removeStoredFile, imageAsDataUrl } from "../utils/imageUpload.js";

function clean(value) { const v = String(value ?? "").trim(); return v || null; }
function publicExpense(item){ if(!item)return item; const {receiptFilePath,...safe}=item; delete safe.receiptMimeType; return {...safe,hasReceipt:Boolean(receiptFilePath)}; }
function monthRange(month) {
  const m = /^\d{4}-\d{2}$/.test(month || "") ? month : new Date().toISOString().slice(0,7);
  const [year, mon] = m.split("-").map(Number);
  return { month:m, start:new Date(Date.UTC(year,mon-1,1)), end:new Date(Date.UTC(year,mon,1)) };
}

class ExpenseService {
  async listCategories(condominiumId) {
    return prisma.expenseCategory.findMany({ where:{ condominiumId, deletedAt:null }, orderBy:[{active:"desc"},{name:"asc"}] });
  }
  async createCategory(condominiumId, data, user, requestContext) {
    const name = clean(data.name);
    if (!name || name.length < 2) throw new ApiError("Informe o nome da categoria.",422);
    const existing = await prisma.expenseCategory.findFirst({where:{condominiumId,name:{equals:name,mode:"insensitive"},deletedAt:null}});
    if (existing) throw new ApiError("Já existe uma categoria com esse nome.",409);
    const created = await prisma.expenseCategory.create({data:{condominiumId,name}});
    await AuditLogService.logCreate({condominiumId,user,module:"EXPENSE_CATEGORY",referenceId:created.id,afterData:created,details:"Categoria de despesa criada.",requestContext});
    return created;
  }
  async updateCategory(id, condominiumId, data, user, requestContext) {
    const before = await prisma.expenseCategory.findFirst({where:{id,condominiumId,deletedAt:null}});
    if (!before) throw new ApiError("Categoria não encontrada.",404);
    const name = clean(data.name) ?? before.name;
    const updated = await prisma.expenseCategory.update({where:{id},data:{name,active:data.active ?? before.active}});
    await AuditLogService.logUpdate({condominiumId,user,module:"EXPENSE_CATEGORY",referenceId:id,beforeData:before,afterData:updated,details:"Categoria de despesa atualizada.",requestContext});
    return updated;
  }
  async removeCategory(id, condominiumId, user, requestContext) {
    const before = await prisma.expenseCategory.findFirst({where:{id,condominiumId,deletedAt:null}});
    if (!before) throw new ApiError("Categoria não encontrada.",404);
    const count = await prisma.expense.count({where:{condominiumId,categoryId:id,deletedAt:null}});
    if (count) throw new ApiError("Não é possível excluir uma categoria com despesas vinculadas. Desative-a.",409);
    await prisma.expenseCategory.update({where:{id},data:{deletedAt:new Date(),active:false}});
    await AuditLogService.logDelete({condominiumId,user,module:"EXPENSE_CATEGORY",referenceId:id,beforeData:before,details:"Categoria de despesa removida.",requestContext});
    return {id};
  }
  async list(condominiumId, query={}) {
    const {start,end,month}=monthRange(query.month);
    const where={condominiumId,deletedAt:null,expenseDate:{gte:start,lt:end}};
    if (query.categoryId) where.categoryId=query.categoryId;
    if (clean(query.search)) where.OR=[{description:{contains:clean(query.search),mode:"insensitive"}},{supplier:{contains:clean(query.search),mode:"insensitive"}}];
    const items=await prisma.expense.findMany({where,include:{category:true},orderBy:[{expenseDate:"desc"},{createdAt:"desc"}]});
    const totalInCents=items.reduce((sum,item)=>sum+item.amountInCents,0);
    const categoryMap=new Map();
    for(const item of items){ const key=item.categoryId; const row=categoryMap.get(key)||{categoryId:key,categoryName:item.category?.name||"Sem categoria",totalInCents:0,count:0}; row.totalInCents+=item.amountInCents; row.count+=1; categoryMap.set(key,row); }
    const byCategory=[...categoryMap.values()].sort((a,b)=>b.totalInCents-a.totalInCents);
    return {month,items:items.map(publicExpense),summary:{totalInCents,count:items.length,averageInCents:items.length?Math.round(totalInCents/items.length):0,largestCategory:byCategory[0]??null,byCategory}};
  }
  async create(condominiumId, data, user, requestContext) {
    const category=await prisma.expenseCategory.findFirst({where:{id:data.categoryId,condominiumId,active:true,deletedAt:null}});
    if(!category) throw new ApiError("Categoria inválida ou inativa.",422);
    const description=clean(data.description); const amount=Number(data.amountInCents);
    if(!description || description.length<3) throw new ApiError("Informe uma descrição válida.",422);
    if(!Number.isInteger(amount)||amount<=0) throw new ApiError("Informe um valor maior que zero.",422);
    const expenseDate=new Date(data.expenseDate); if(Number.isNaN(expenseDate.getTime())) throw new ApiError("Data da despesa inválida.",422);
    const receipt=await saveImageDataUrl(data.receiptImageDataUrl,"expense-receipts");
    const created=await prisma.expense.create({data:{condominiumId,categoryId:category.id,expenseDate,description,supplier:clean(data.supplier),paymentMethod:clean(data.paymentMethod),amountInCents:amount,notes:clean(data.notes),receiptFilePath:receipt?.filePath??null,receiptMimeType:receipt?.mimeType??null,createdByUserId:user?.id??null},include:{category:true}});
    await AuditLogService.logCreate({condominiumId,user,module:"EXPENSE",referenceId:created.id,afterData:{...created,receiptFilePath:created.receiptFilePath?"[arquivo]":null},details:"Despesa cadastrada.",requestContext});
    return publicExpense(created);
  }
  async update(id, condominiumId, data, user, requestContext) {
    const before=await prisma.expense.findFirst({where:{id,condominiumId,deletedAt:null},include:{category:true}}); if(!before) throw new ApiError("Despesa não encontrada.",404);
    let categoryId=before.categoryId;
    if(data.categoryId && data.categoryId !== before.categoryId){
      const category=await prisma.expenseCategory.findFirst({where:{id:data.categoryId,condominiumId,active:true,deletedAt:null}});
      if(!category) throw new ApiError("Categoria inválida ou inativa.",422);
      categoryId=category.id;
    }
    let receiptPath=before.receiptFilePath, receiptMime=before.receiptMimeType;
    if(data.receiptImageDataUrl){ const receipt=await saveImageDataUrl(data.receiptImageDataUrl,"expense-receipts"); await removeStoredFile(before.receiptFilePath); receiptPath=receipt.filePath; receiptMime=receipt.mimeType; }
    const amount=data.amountInCents===undefined?before.amountInCents:Number(data.amountInCents); if(!Number.isInteger(amount)||amount<=0) throw new ApiError("Valor inválido.",422);
    const updated=await prisma.expense.update({where:{id},data:{categoryId,expenseDate:data.expenseDate?new Date(data.expenseDate):before.expenseDate,description:clean(data.description)??before.description,supplier:data.supplier===undefined?before.supplier:clean(data.supplier),paymentMethod:data.paymentMethod===undefined?before.paymentMethod:clean(data.paymentMethod),amountInCents:amount,notes:data.notes===undefined?before.notes:clean(data.notes),receiptFilePath:receiptPath,receiptMimeType:receiptMime},include:{category:true}});
    await AuditLogService.logUpdate({condominiumId,user,module:"EXPENSE",referenceId:id,beforeData:{...before,receiptFilePath:before.receiptFilePath?"[arquivo]":null},afterData:{...updated,receiptFilePath:updated.receiptFilePath?"[arquivo]":null},details:"Despesa atualizada.",requestContext});
    return publicExpense(updated);
  }
  async receipt(id, condominiumId){ const item=await prisma.expense.findFirst({where:{id,condominiumId,deletedAt:null}}); if(!item) throw new ApiError("Despesa não encontrada.",404); if(!item.receiptFilePath) throw new ApiError("Esta despesa não possui comprovante.",404); const dataUrl=await imageAsDataUrl(item.receiptFilePath,item.receiptMimeType); if(!dataUrl) throw new ApiError("Comprovante indisponível.",404); return {dataUrl,mimeType:item.receiptMimeType}; }
  async remove(id, condominiumId, user, requestContext){ const before=await prisma.expense.findFirst({where:{id,condominiumId,deletedAt:null}}); if(!before) throw new ApiError("Despesa não encontrada.",404); await prisma.expense.update({where:{id},data:{deletedAt:new Date()}}); await AuditLogService.logDelete({condominiumId,user,module:"EXPENSE",referenceId:id,beforeData:{...before,receiptFilePath:before.receiptFilePath?"[arquivo]":null},details:"Despesa removida.",requestContext}); return {id}; }
}
export default new ExpenseService();

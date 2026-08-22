import ResidentService from "../services/ResidentService.js";

class ResidentController {
  async index(req,res,next){
    try{
      const {residentType, apartmentId}=req.query;
      const condominiumId=req.user.condominiumId;

      let data;
      if(apartmentId){
        data=await ResidentService.findByApartment(apartmentId,condominiumId);
      }else if(residentType){
        data=await ResidentService.findByResidentType(condominiumId,residentType);
      }else{
        data=await ResidentService.findAll(condominiumId);
      }

      return res.json({success:true,data});
    }catch(error){next(error);}
  }

  async directory(
    req,
    res,
    next
  ) {
    try {
      const data =
        await ResidentService
          .operationalDirectory(
            req.user
              .condominiumId
          );

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async show(req,res,next){
    try{
      const data=await ResidentService.findById(req.params.id,req.user.condominiumId);
      return res.json({success:true,data});
    }catch(error){next(error);}
  }

  async create(req,res,next){
    try{
      const data=await ResidentService.create(
        req.user.condominiumId,
        req.body,
        req.user,
        {ipAddress:req.ip,userAgent:req.get("user-agent")}
      );
      return res.status(201).json({
        success:true,
        message:"Morador cadastrado com sucesso.",
        data
      });
    }catch(error){next(error);}
  }

  async update(req,res,next){
    try{
      const data=await ResidentService.update(
        req.params.id,
        req.user.condominiumId,
        req.body,
        req.user,
        {ipAddress:req.ip,userAgent:req.get("user-agent")}
      );
      return res.json({success:true,message:"Morador atualizado com sucesso.",data});
    }catch(error){next(error);}
  }

  async changeApartment(req,res,next){
    try{
      const data=await ResidentService.changeApartment(
        req.params.id,
        req.user.condominiumId,
        req.body.apartmentId,
        req.user,
        {ipAddress:req.ip,userAgent:req.get("user-agent")}
      );
      return res.json({success:true,message:"Apartamento alterado com sucesso.",data});
    }catch(error){next(error);}
  }

  async updatePermissions(req,res,next){
    try{
      const data=await ResidentService.updatePermissions(
        req.params.id,
        req.user.condominiumId,
        req.body,
        req.user,
        {ipAddress:req.ip,userAgent:req.get("user-agent")}
      );
      return res.json({success:true,message:"Permissões atualizadas.",data});
    }catch(error){next(error);}
  }

  async resetPassword(req,res,next){
    try{
      const data=await ResidentService.resetPassword(
        req.params.id,
        req.user.condominiumId,
        req.body.newPassword,
        req.user,
        {ipAddress:req.ip,userAgent:req.get("user-agent")}
      );
      return res.json({success:true,message:"Senha redefinida.",data});
    }catch(error){next(error);}
  }

  async remove(req,res,next){
    try{
      const data=await ResidentService.remove(
        req.params.id,
        req.user.condominiumId,
        req.user,
        {ipAddress:req.ip,userAgent:req.get("user-agent")}
      );
      return res.json({success:true,...data});
    }catch(error){next(error);}
  }

  async statistics(req,res,next){
    try{
      const data=await ResidentService.statistics(req.user.condominiumId);
      return res.json({success:true,data});
    }catch(error){next(error);}
  }
}

export default new ResidentController();

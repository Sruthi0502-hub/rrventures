import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SetupSuperAdminDto } from './dto/setup-super-admin.dto';
import { Admin, AdminDocument, Role } from 'src/admins/schemas/admin.schema';
import { Model } from 'mongoose';
import { JwtStrategy } from './jwtStrategy';
import * as bcrypt from 'bcrypt'
import { loginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { updateAdminDto } from 'src/admins/dto/update-admin.dto';


@Injectable()
export class AuthService {
  constructor
    (
      @InjectModel(Admin.name)
      private adminModel: Model<AdminDocument>,
      private JwtService: JwtService
    ) { }


  async setupSuperAdmin(dto: SetupSuperAdminDto) {
    try {

      const superAdmin = await this.adminModel.findOne({
        role: Role.SUPER_ADMIN
      })
      if (superAdmin) {
        throw new BadRequestException('Super Admin already exists')
      }
      const hashpass = await bcrypt.hash(dto.password, 10)
      const admin = await this.adminModel.create({
        ...dto,
        password: hashpass,
        role: Role.SUPER_ADMIN
      })
      return {
        message: 'Super Admin Created Successfully', admin
      }
    }
    catch (error: any) {
      throw new BadRequestException(error.message)
    }
  }


  async Login(dto: loginDto) {
    try {
      const admin = await this.adminModel.findOne({
        email: dto.email
      })
      if (!admin) {
        throw new UnauthorizedException('Invalid Credentials')
      }

      const isMatch = await bcrypt.compare(dto.password, admin.password)
      if (!isMatch) {
        throw new UnauthorizedException('Invalid Credentials')
      }

      const payload = {
        sub: admin.id,
        email: admin.email,
        role: admin.role
      }

      return {
        message: 'Login Succesfull',
        access_token: this.JwtService.sign(payload)
      }
    }
    catch (error: any) {
      throw new BadRequestException(error.message)
    }

  }




}

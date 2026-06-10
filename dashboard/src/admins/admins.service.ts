import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Admin, Role } from './schemas/admin.schema';
import { Model } from 'mongoose';
import { createAdminDto } from './dto/create-admin.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { send } from 'process';
import { Property } from 'src/properties/schemas/property.schema';
import { updateAdminDto } from './dto/update-admin.dto';
import { BADSTR } from 'dns';


@Injectable()
export class AdminsService {

    constructor(
        @InjectModel(Admin.name)
        private adminModel: Model<Admin>,

        @InjectModel(Property.name)
        private PropertyModel: Model<Property>
    ) { }

    async createAdmin(adminDto: createAdminDto) {
        try {
            const salt = 10;
            const hashpass = await bcrypt.hash(adminDto.password, salt);
            const newAdmin = new this.adminModel({ ...adminDto, password: hashpass, role: Role.ADMIN })
            await newAdmin.save();
            return {
                message: 'Admin Created by Super_Admin',
                newAdmin
            }
        }
        catch (error: any) {
            throw new BadRequestException(error.message)
        }
    }




    async getAdmins() {
        try {
            const admin = await this.adminModel.find();
            return admin
        }
        catch (error: any) {
            throw new BadRequestException(error.message)
        }
    }


    async deleteAdmin(id: string) {
        try {

            const admin = await this.adminModel.findOne({ _id: id })
            if (!admin) {
                throw new NotFoundException('Admin Not Found')
            }
            await this.PropertyModel.deleteMany({
                createdBy: id,
            });

            await this.adminModel.findOneAndDelete({ _id: id })
            return {
                message: 'Admin Deleted Successfully By Super-Admin '
            }
        }
        catch (error: any) {
            throw new BadRequestException(error.message)
        }
    }

    async getAllAdmin() {
        try {

            const admins = await this.adminModel.find();
            const result = await Promise.all(
                admins.map(async (admin) => {
                    const propertyCount = await this.PropertyModel.countDocuments({
                        createdBy: admin._id as any
                    })
                    return {
                        _id: admin._id,
                        name: admin.name,
                        email: admin.email,
                        role: admin.role,
                        propertyCount
                    }
                })
            )
            return result
        }
        catch (error: any) {
            throw new BadRequestException(error.message)
        }
    }

    async updateAdminProfile(userId: string, dto: updateAdminDto,) {
        try {
            const admin = await this.adminModel.findById(userId);

            if (!admin) {
                throw new NotFoundException('Admin Not Found');
            }

            if (dto.name) {
                admin.name = dto.name;
            }

            if (dto.email) {
                admin.email = dto.email;
            }

            if (dto.newPassword) {
                if (!dto.oldPassword) {
                    throw new BadRequestException(
                        'Old password is required',
                    );
                }

                const isMatch = await bcrypt.compare(
                    dto.oldPassword,
                    admin.password,
                );

                if (!isMatch) {
                    throw new BadRequestException(
                        'Old password is incorrect',
                    );
                }

                admin.password = await bcrypt.hash(
                    dto.newPassword,
                    10,
                );
            }

            await admin.save();

            return {
                message: 'Profile Updated Successfully',
                admin
            };
        }
        catch (error: any) {
            throw new BadRequestException(error.message)
        }
    }

}

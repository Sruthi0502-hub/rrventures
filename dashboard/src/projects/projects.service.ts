import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Role } from 'src/admins/schemas/admin.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private projectModel: Model<ProjectDocument>,
  ) {}

  async create(dto: CreateProjectDto, file: Express.Multer.File, user: any) {
    try {
      let parsedSpecs = {};
      if (dto.specifications) {
        try {
          parsedSpecs = typeof dto.specifications === 'string'
            ? JSON.parse(dto.specifications)
            : dto.specifications;
        } catch (e) {
          // ignore or handle
        }
      }

      return await this.projectModel.create({
        ...dto,
        specifications: parsedSpecs,
        image: file ? file.filename : '',
        gallery: file ? [file.filename] : [],
        createdBy: user.userId || user.id,
      });
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  async findAllPublic() {
    try {
      return await this.projectModel.find({ status: 'Active' }).populate('createdBy', 'name email').exec();
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  async findOne(id: string) {
    try {
      const project = await this.projectModel.findById(id).populate('createdBy', 'name email').exec();
      if (!project) {
        throw new NotFoundException('Project Not Found');
      }
      return project;
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  async findByAdmin(userId: string, user: any) {
    try {
      if (user.role === Role.SUPER_ADMIN) {
        return await this.projectModel.find().populate('createdBy', 'name email').exec();
      }
      return await this.projectModel.find({ createdBy: userId }).populate('createdBy', 'name email').exec();
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  async update(id: string, dto: UpdateProjectDto, user: any, file: Express.Multer.File) {
    try {
      const project = await this.projectModel.findById(id);
      if (!project) {
        throw new NotFoundException('Project Not Found');
      }
      if (user.role === Role.ADMIN && project.createdBy.toString() !== user.userId) {
        throw new ForbiddenException('You can update only own projects');
      }

      let parsedSpecs = undefined;
      if (dto.specifications) {
        try {
          parsedSpecs = typeof dto.specifications === 'string'
            ? JSON.parse(dto.specifications)
            : dto.specifications;
        } catch (e) {
          // ignore
        }
      }

      const updateData: any = { ...dto };
      if (parsedSpecs !== undefined) {
        updateData.specifications = parsedSpecs;
      }
      if (file) {
        updateData.image = file.filename;
        updateData.gallery = project.gallery ? [file.filename, ...project.gallery] : [file.filename];
      }

      return await this.projectModel.findByIdAndUpdate(id, updateData, { new: true });
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  async remove(id: string, user: any) {
    try {
      const project = await this.projectModel.findById(id);
      if (!project) {
        throw new NotFoundException('Project Not Found');
      }
      if (user.role === Role.ADMIN && project.createdBy.toString() !== user.userId) {
        throw new ForbiddenException('You can delete only own projects');
      }
      await this.projectModel.findByIdAndDelete(id);
      return { message: 'Project Deleted Successfully' };
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }
}

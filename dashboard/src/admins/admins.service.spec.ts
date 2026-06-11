import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AdminsService } from './admins.service';
import { Admin } from './schemas/admin.schema';
import { Property } from 'src/properties/schemas/property.schema';

describe('AdminsService', () => {
  let service: AdminsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminsService,
        { provide: getModelToken(Admin.name), useValue: {} },
        { provide: getModelToken(Property.name), useValue: {} },
      ],
    }).compile();

    service = module.get<AdminsService>(AdminsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

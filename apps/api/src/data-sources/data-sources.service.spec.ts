import { Test, TestingModule } from '@nestjs/testing';
import { DataSourcesService } from './data-sources.service';

describe('DataSourcesService', () => {
  let service: DataSourcesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataSourcesService],
    }).useMocker(() => ({})).compile();

    service = module.get<DataSourcesService>(DataSourcesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

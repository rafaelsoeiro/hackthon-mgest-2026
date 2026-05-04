import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingService } from './embedding.service';

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmbeddingService],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);
  });

  describe('when model is NOT loaded', () => {
    it('should return null gracefully without throwing', async () => {
      // Model not loaded (onModuleInit not called)
      expect(service.modelLoaded).toBe(false);

      const result = await service.generateEmbedding('qualquer texto em pt-BR');

      expect(result).toBeNull();
    });

    it('should not throw exceptions for any input', async () => {
      await expect(service.generateEmbedding('')).resolves.toBeNull();

      await expect(
        service.generateEmbedding('a'.repeat(5000)),
      ).resolves.toBeNull();
    });
  });

  describe('when model IS loaded (mocked pipeline)', () => {
    const EMBEDDING_DIM = 384;

    beforeEach(() => {
      // Simulate a loaded model with a mock pipeline
      const fakeEmbedding = new Float32Array(EMBEDDING_DIM).fill(0.1);
      (service as any).pipeline = jest.fn().mockResolvedValue({
        data: fakeEmbedding,
      });
      service.modelLoaded = true;
    });

    it('should return embedding with exactly 384 dimensions', async () => {
      const result = await service.generateEmbedding(
        'Sistema WMS do CD01 parou de funcionar',
      );

      expect(result).not.toBeNull();
      expect(result).toHaveLength(EMBEDDING_DIM);
      expect(typeof result![0]).toBe('number');
    });

    it('should truncate long text to max chars', async () => {
      const longText = 'a'.repeat(5000);
      await service.generateEmbedding(longText);

      const pipelineMock = (service as any).pipeline as jest.Mock;
      const calledWith = pipelineMock.mock.calls[0][0];
      expect(calledWith.length).toBeLessThanOrEqual(2048);
    });

    it('should return null if pipeline exceeds timeout', async () => {
      (service as any).pipeline = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 1000)),
        );

      const result = await service.generateEmbedding('texto teste');

      expect(result).toBeNull();
    });
  });

  describe('updateCentroid', () => {
    it('should calculate mean vector of embeddings', () => {
      const emb1 = new Array(384).fill(1);
      const emb2 = new Array(384).fill(3);
      const emb3 = new Array(384).fill(5);

      const centroid = service.updateCentroid([emb1, emb2, emb3]);

      expect(centroid).toHaveLength(384);
      expect(centroid[0]).toBe(3); // mean of [1, 3, 5]
      expect(centroid[383]).toBe(3);
    });

    it('should return zero vector for empty input', () => {
      const centroid = service.updateCentroid([]);

      expect(centroid).toHaveLength(384);
      expect(centroid.every((v) => v === 0)).toBe(true);
    });

    it('should return the same vector for single embedding', () => {
      const emb = Array.from({ length: 384 }, (_, i) => i * 0.01);

      const centroid = service.updateCentroid([emb]);

      expect(centroid).toHaveLength(384);
      centroid.forEach((v, i) => {
        expect(v).toBeCloseTo(emb[i], 10);
      });
    });
  });
});

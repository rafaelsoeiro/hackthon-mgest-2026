import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private pipeline: any = null;
  modelLoaded = false;

  private static readonly MODEL_NAME =
    'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
  private static readonly EMBEDDING_DIM = 384;
  private static readonly MAX_CHARS = 2048;
  private static readonly TIMEOUT_MS = 500;

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Carregando modelo de embedding multilíngue...');
      const { pipeline } = await import('@xenova/transformers');
      this.pipeline = await pipeline(
        'feature-extraction',
        EmbeddingService.MODEL_NAME,
      );
      this.modelLoaded = true;
      this.logger.log('Modelo de embedding carregado com sucesso (singleton)');
    } catch (err) {
      this.logger.warn(
        `Falha ao carregar modelo de embedding: ${err instanceof Error ? err.message : err}. Sistema continuará sem embeddings.`,
      );
      this.modelLoaded = false;
    }
  }

  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.modelLoaded || !this.pipeline) {
      return null;
    }

    const truncated = text.substring(0, EmbeddingService.MAX_CHARS);

    try {
      const result: number[] | null = await Promise.race([
        this.runPipeline(truncated),
        this.timeoutPromise(),
      ]);
      return result;
    } catch (err) {
      this.logger.warn(
        `Erro ao gerar embedding: ${err instanceof Error ? err.message : err}`,
      );
      return null;
    }
  }

  updateCentroid(embeddings: number[][]): number[] {
    if (embeddings.length === 0) {
      return new Array(EmbeddingService.EMBEDDING_DIM).fill(0);
    }

    const dim = EmbeddingService.EMBEDDING_DIM;
    const centroid = new Array(dim).fill(0);

    for (const emb of embeddings) {
      for (let i = 0; i < dim; i++) {
        centroid[i] += emb[i];
      }
    }

    const len = embeddings.length;
    for (let i = 0; i < dim; i++) {
      centroid[i] /= len;
    }

    return centroid;
  }

  private async runPipeline(text: string): Promise<number[]> {
    const output = await this.pipeline(text, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data as Float32Array);
  }

  private timeoutPromise(): Promise<null> {
    return new Promise((resolve) =>
      setTimeout(() => resolve(null), EmbeddingService.TIMEOUT_MS),
    );
  }
}

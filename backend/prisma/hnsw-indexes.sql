-- Índices HNSW para busca por similaridade de embeddings (pgvector)
-- Executar após prisma migrate dev --name init

CREATE INDEX IF NOT EXISTS idx_processed_feedback_embedding
  ON "processed_feedbacks" USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_incident_group_centroid_embedding
  ON "incident_groups" USING hnsw ("centroidEmbedding" vector_cosine_ops);

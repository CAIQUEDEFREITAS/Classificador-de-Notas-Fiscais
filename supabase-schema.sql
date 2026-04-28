-- Script SQL para criar a tabela de notas fiscais no Supabase
-- Execute este script no SQL Editor do seu projeto Supabase

CREATE TABLE IF NOT EXISTS notas_fiscais (
  id SERIAL PRIMARY KEY,
  chave_acesso VARCHAR(44) UNIQUE,
  numero VARCHAR(20),
  serie VARCHAR(10),
  data_emissao TIMESTAMP,
  tipo_operacao VARCHAR(10),
  emitente_cnpj VARCHAR(20),
  emitente_nome TEXT,
  destinatario_cnpj VARCHAR(20),
  destinatario_cpf VARCHAR(15),
  destinatario_nome TEXT,
  valor_total DECIMAL(15,2),
  valor_icms DECIMAL(15,2) DEFAULT 0,
  valor_ipi DECIMAL(15,2) DEFAULT 0,
  valor_pis DECIMAL(15,2) DEFAULT 0,
  valor_cofins DECIMAL(15,2) DEFAULT 0,
  xml_bruto TEXT,
  validacoes JSONB,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_chave_acesso ON notas_fiscais(chave_acesso);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_data_emissao ON notas_fiscais(data_emissao);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_emitente_cnpj ON notas_fiscais(emitente_cnpj);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_destinatario_cnpj ON notas_fiscais(destinatario_cnpj);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_criado_em ON notas_fiscais(criado_em);

-- Políticas RLS (Row Level Security) - opcional
ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura/escrita para usuários autenticados
CREATE POLICY "Permitir tudo para usuários autenticados" ON notas_fiscais
  FOR ALL USING (auth.role() = 'authenticated');

-- ATENÇÃO: Em desenvolvimento, se precisar desabilitar RLS temporariamente,
-- use: ALTER TABLE notas_fiscais DISABLE ROW LEVEL SECURITY;
-- NUNCA use políticas "USING (true)" em produção.
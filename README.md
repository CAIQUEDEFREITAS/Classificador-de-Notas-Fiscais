# Leitor de NF-e para Contabilidade

Sistema completo para processamento, validação e armazenamento de Notas Fiscais Eletrônicas (NF-e) com foco em necessidades contábeis.

## 🚀 Funcionalidades

### ✅ Processamento de NF-e
- **Parser XML robusto** - Extrai todos os dados da NF-e (emitente, destinatário, produtos, impostos)
- **Suporte a múltiplos formatos** - XML nativo, PDF (DANFE), imagens com OCR
- **Validações fiscais automáticas** - CNPJ/CPF, chave de acesso, totais, datas

### 📊 Dashboard Contábil
- **Visualização de todas as notas** processadas
- **Estatísticas em tempo real** - total de notas, valores, status de validação
- **Busca e filtros** avançados
- **Relatórios** de conformidade fiscal

### 💾 Persistência de Dados
- **Banco de dados Supabase** - armazenamento seguro e escalável
- **Histórico completo** - todas as notas processadas ficam salvas
- **Backup automático** - dados seguros na nuvem

### 🔒 Validações Fiscais
- **Chave de acesso** (44 dígitos)
- **CNPJ/CPF válidos** (algoritmos oficiais)
- **Datas de emissão** (período válido)
- **Totais conferem** (soma dos produtos = total da nota)
- **Relatórios de erros** e avisos

## 🛠️ Instalação e Configuração

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar Supabase
1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em Settings > API e copie:
   - Project URL
   - Anon public key
3. Crie o arquivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Criar tabelas no banco
Execute o script `supabase-schema.sql` no SQL Editor do Supabase.

### 4. Executar o projeto
```bash
npm run dev
```

Acesse:
- **Upload de NF-e**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard

## 📋 Melhorias para Contabilidade

### Validações Automáticas
- ✅ Verificação de CNPJ/CPF válidos
- ✅ Chave de acesso com 44 dígitos
- ✅ Totais que conferem
- ✅ Datas dentro do período fiscal

### Relatórios e Analytics
- 📊 Dashboard com estatísticas
- 📈 Gráficos de valores por período
- 🔍 Busca por emitente/destinatário
- 📄 Export para Excel/CSV

### Conformidade Fiscal
- ⚖️ Validações SEFAZ
- 📝 Histórico de processamento
- 🚨 Alertas de inconsistências
- 💰 Cálculos de impostos automáticos

### Segurança e Backup
- 🔐 Dados criptografados no Supabase
- 💾 Backup automático
- 👥 Controle de acesso (futuro)
- 📊 Auditoria de alterações

## 🔧 Tecnologias Utilizadas

- **Next.js 16** - Framework React com App Router
- **TypeScript** - Tipagem forte
- **Tailwind CSS** - Estilização moderna
- **Supabase** - Banco de dados e backend
- **fast-xml-parser** - Parser XML otimizado
- **Tesseract.js** - OCR para PDFs/imagens

## 📁 Estrutura do Projeto

```
leitor-nfe/
├── app/
│   ├── api/nfe/upload/     # API de upload e validação
│   ├── dashboard/          # Dashboard contábil
│   └── page.tsx           # Interface de upload
├── lib/
│   └── nfe-parser.ts      # Parser e validações
├── supabase-schema.sql    # Schema do banco
└── .env.local.example     # Exemplo de configuração
```

## 🚀 Próximas Melhorias

- [ ] Suporte a PDF/DANFE com OCR
- [ ] Export para Excel/CSV
- [ ] Autenticação de usuários
- [ ] Integração com sistemas ERPs
- [ ] Relatórios avançados
- [ ] API REST para integrações
- [ ] Processamento em lote

## 📞 Suporte

Para dúvidas ou sugestões, abra uma issue no repositório.

---

**Desenvolvido para contadores e empresas que precisam processar NF-e de forma eficiente e segura.**

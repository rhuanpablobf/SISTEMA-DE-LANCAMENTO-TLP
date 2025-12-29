# PRD – Sistema de Cálculo e Gestão da TLP (Taxa de Limpeza Pública)

## 1. Visão Geral

O sistema de **TLP (Taxa de Limpeza Pública)** tem como objetivo calcular, simular, auditar e gerir o lançamento da taxa para imóveis do Município de Goiânia, utilizando dados oficiais de cadastro imobiliário, atividades econômicas (CNAE), tipos de edificação e parâmetros legais vigentes.

O sistema será **data‑driven**, com regras claras, auditáveis e versionadas, permitindo:
- Reprocessamento de exercícios
- Simulações com diferentes parâmetros
- Transparência técnica e jurídica
- Integração futura com sistemas de lançamento e arrecadação

---

## 2. Objetivos do Sistema

### 2.1 Objetivos Funcionais
- Consolidar dados de imóveis, empresas e tipos de edificação
- Classificar o **uso principal do imóvel** por inscrição
- Determinar a **atividade considerada** (residencial, serviço, comércio, indústria, público)
- Calcular a TLP conforme parâmetros oficiais
- Aplicar regras de não incidência
- Gerar simulações e lotes de lançamento

### 2.2 Objetivos Não Funcionais
- Rastreabilidade completa
- Versionamento de parâmetros
- Reprocessamento seguro
- Performance para +1 milhão de registros
- Base única de verdade (PostgreSQL)

---

## 3. Arquitetura Geral

### 3.1 Camadas de Dados

**RAW** – Dados brutos, sem regras:
- `raw_lancamento_2026`
- `raw_empresas_inscricao`
- `raw_empresa_cnae`
- `raw_tipo_edf`

**STAGING (STG)** – Dados tratados, deduplicados:
- `stg_lancamento_2026`
- `stg_empresas_inscricao`
- `stg_empresa_cnae`

**DIMENSÕES** – Cadastros oficiais:
- `dim_cnae_fiscal`
- `dim_bairro`
- `dim_logradouro`
- `inscricao_tipo_edf`

**TLP – CONTROLE E NEGÓCIO**
- `tlp_parametros`
- `tlp_nao_incidencia`
- `tlp_simulacao`
- `tlp_lote_lancamento`

**VIEWS DE NEGÓCIO**
- `vw_imovel_base`
- `vw_empresas_ativas_por_inscricao`
- `vw_rank_empresas_por_inscricao`
- `vw_uso_imovel_por_inscricao`

---

## 4. Modelo de Negócio – Regras Centrais

### 4.1 Unidade de Cálculo

A **inscrição imobiliária (`codg_inscricao_lan`)** é a unidade central do sistema.

Todos os dados são agregados, classificados e calculados **por inscrição**.

---

## 5. Regras de Empresas e CNAE

### 5.1 Empresas Ativas por Inscrição

Fonte:
- `stg_empresas_inscricao`
- `stg_empresa_cnae`

Critérios:
- Empresa vinculada à inscrição
- CNAE ativo

Resultado:
- Uma inscrição pode ter **0, 1 ou N empresas**

View:
- `vw_empresas_ativas_por_inscricao`

Campos principais:
- `codg_inscricao_lan`
- `isn_sia_ativecon_asg`
- `nome_razao_cae`
- `codg_atividade_cnae`
- `descricao_cnae`
- `tipo_atividade_cnae`

---

## 6. Ranking de Atividades por Inscrição

### 6.1 Objetivo

Determinar **qual atividade prevalece** quando há múltiplas empresas na mesma inscrição.

### 6.2 Regras de Prioridade

Prioridade crescente:
1. Serviço
2. Comércio
3. Indústria

### 6.3 Critério Técnico

- Conta CNAEs distintos por tipo
- Gera flags:
  - `tem_servico`
  - `tem_comercio`
  - `tem_industria`

View:
- `vw_rank_empresas_por_inscricao`

Resultado:
- 1 linha por inscrição

---

## 7. Classificação de Uso do Imóvel

### 7.1 Fontes

- `vw_imovel_base`
- `vw_rank_empresas_por_inscricao`

### 7.2 Regras de Uso Classificado

```text
Se propriedade pública (info_propriedade ∈ 2,3,4,5):
    USO = PUBLICO/FILANTROPICO
Senão se tem_industria:
    USO = INDUSTRIA
Senão se tem_comercio:
    USO = COMERCIO
Senão se tem_servico:
    USO = SERVICO
Senão:
    USO = RESIDENCIAL
```

View final:
- `vw_uso_imovel_por_inscricao`

Campos-chave:
- `uso_classificado`
- `atividade_considerada`

---

## 8. Tipos de Edificação (EDF)

### 8.1 Fonte

- `raw_tipo_edf`
- `inscricao_tipo_edf`

### 8.2 Premissas Importantes

- Uma inscrição pode ter múltiplos EDF (ex: edifício + garagem + escaninho)
- **Não se elimina EDF**
- EDF é usado como **fator de cálculo**, não como chave única

Tipos oficiais:
- Casa
- Apartamento
- Edificação em Altura
- Garagem
- Escaninho
- Galpão
- Especial

---

## 9. Parâmetros da TLP

Tabela: `tlp_parametros`

Parâmetros por exercício:
- `custo_tlp_base`
- `ipca_percentual`
- `subsidio_percentual`
- `limite_min_base`
- `limite_max_base`
- `limite_min_atualizado`
- `limite_max_atualizado`

Regras:
- Sempre usar parâmetros do exercício da simulação/lote
- Parâmetros são versionáveis

---

## 10. Não Incidência

Tabela: `tlp_nao_incidencia`

Características:
- Inclusão manual
- Controle por exercício
- Motivo e origem registrados

Regras:
- Se inscrição ativa em `tlp_nao_incidencia` → TLP = 0

---

## 11. Simulação de TLP

Tabela: `tlp_simulacao`

Objetivo:
- Testar regras e parâmetros sem efeito fiscal

Campos:
- `id_simulacao`
- `exercicio`
- `status`
- `descricao`
- `parametros_snapshot`

---

## 12. Lote de Lançamento

Tabela: `tlp_lote_lancamento`

Objetivo:
- Registrar execuções oficiais de cálculo

Campos:
- `exercicio`
- `versao`
- `parametros_snapshot`
- `id_simulacao_origem`

---

## 13. Backend (API)

### 13.1 Stack Sugerida
- FastAPI
- PostgreSQL
- SQLAlchemy

### 13.2 Endpoints Principais

- `/parametros/{exercicio}`
- `/simulacoes`
- `/simulacoes/{id}`
- `/lotes`
- `/lotes/{id}`
- `/imoveis/{inscricao}`
- `/auditoria/{inscricao}`

---

## 14. Frontend

### 14.1 Módulos

- Dashboard geral
- Consulta por inscrição
- Simulações
- Parâmetros
- Não incidência
- Auditoria

### 14.2 Requisitos

- Filtros por exercício
- Visualização explicável do cálculo
- Exportação CSV/PDF

---

## 15. Auditoria e Transparência

Para cada inscrição:
- Origem dos dados
- Regras aplicadas
- Parâmetros usados
- Motivos de exceção

---

## 16. Premissas Finais

- Nenhuma informação é apagada
- Regras são determinísticas
- Sistema preparado para questionamento jurídico

---

## 17. Status Atual

- Modelo validado
- Dados carregados
- Views principais funcionando
- Pronto para implementação no Antigravity

---

**FIM DO PRD**


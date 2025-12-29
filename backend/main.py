from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, desc
from database import get_db, Base, engine
from pydantic import BaseModel
# Importar models para registrar no Base.metadata
import models
from typing import Optional
from decimal import Decimal
import os

# WORKAROUND: Fix para erro de UnicodeDecodeError no Windows quando o path do projeto tem acentos (LANÇAMENTO)
# O driver psycopg2/SQLAlchemy falha ao processar paths com caracteres não-ASCII em algumas configurações de locale.
try:
    os.chdir("C:\\Users\\Public")
except:
    pass

app = FastAPI(title="API Sistema TLP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://tlp-front.onrender.com",
        "https://sistema-de-lancamento-tlp.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_check():
    # Garantir que o schema e tabelas existam
    try:
        with engine.connect() as conn:
            with conn.begin():
                conn.execute(text("CREATE SCHEMA IF NOT EXISTS tlp"))
        
        # Cria as tabelas se não existirem
        Base.metadata.create_all(bind=engine)
        print("Schema e Tabelas verificados com sucesso.")
    except Exception as e:
        print(f"Erro ao inicializar banco de dados: {e}")

    # Migração de colunas (para tabelas existentes)
    try:
        with engine.connect() as conn:
            with conn.begin():
                columns = [
                    ("ipca_percentual", "NUMERIC(5, 2)"),
                    ("subsidio_percentual", "NUMERIC(5, 2)"),
                    ("limite_min_base", "NUMERIC(10, 2)"),
                    ("limite_max_base", "NUMERIC(10, 2)"),
                    ("limite_min_atualizado", "NUMERIC(10, 2)"),
                    ("limite_max_atualizado", "NUMERIC(10, 2)")
                ]
                for col_name, col_type in columns:
                    try:
                        conn.execute(text(f"ALTER TABLE tlp.tlp_parametros ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                    except Exception as e:
                        print(f"Migration warning for {col_name}: {e}")
            
            # 2. Corrigir tipos das colunas (para evitar Overflow de Numeric(10,2))
            with conn.begin():
                alter_cols = [
                    ("custo_tlp_base", "NUMERIC(18, 2)"),
                    ("limite_min_base", "NUMERIC(18, 2)"),
                    ("limite_max_base", "NUMERIC(18, 2)"),
                    ("limite_min_atualizado", "NUMERIC(18, 2)"),
                    ("limite_max_atualizado", "NUMERIC(18, 2)")
                ]
                for col, dtype in alter_cols:
                    try:
                        # Postgres syntax strict
                        conn.execute(text(f"ALTER TABLE tlp.tlp_parametros ALTER COLUMN {col} TYPE {dtype}"))
                    except Exception as ex:
                        print(f"Type Fix Warning {col}: {ex}")

            print("DB Migration checks completed.")
    except Exception as e:
        print(f"Startup DB Migration failed: {e}")


# Schemas
class ParametroCreate(BaseModel):
    exercicio: int
    custo_tlp_base: float
    ipca_percentual: Optional[float] = 0
    subsidio_percentual: Optional[float] = 0
    limite_min_base: Optional[float] = 0
    limite_max_base: Optional[float] = 0
    limite_min_atualizado: Optional[float] = 0
    limite_max_atualizado: Optional[float] = 0

@app.get("/")
def read_root():
    return {"message": "API Sistema TLP Online"}

@app.get("/debug-db")
def debug_db():
    from sqlalchemy import inspect
    from database import engine
    try:
        inspector = inspect(engine)
        schemas = inspector.get_schema_names()
        tables = []
        for schema in schemas:
            for table in inspector.get_table_names(schema=schema):
                tables.append(f"{schema}.{table}")
        return {"schemas": schemas, "tables": tables}
    except Exception as e:
        return {"error": str(e)}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/imoveis/{inscricao}")
def get_imovel(inscricao: str, db: Session = Depends(get_db)):
    try:
        from models import UsoImovel
        
        imovel = db.query(UsoImovel).filter(UsoImovel.codg_inscricao_lan == inscricao).first()
        
        if not imovel:
            raise HTTPException(status_code=404, detail="Imóvel não encontrado")
            
        return imovel
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar imóvel: {str(e)}")

@app.get("/parametros")
def get_parametros(db: Session = Depends(get_db)):
    try:
        from models import TlpParametros
        # Retorna o parametro ativo mais recente de cada exercício
        # Simplificação: retorna todos ordenados por exercício desc e versão desc
        params = db.query(TlpParametros).order_by(desc(TlpParametros.exercicio), desc(TlpParametros.versao)).all()
        return params
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar parâmetros: {str(e)}")

@app.post("/parametros")
def create_parametro(param: ParametroCreate, db: Session = Depends(get_db)):
    from models import TlpParametros
    
    # Verifica ultima versão para esse exercicio
    last_version = db.query(TlpParametros).filter(TlpParametros.exercicio == param.exercicio).order_by(desc(TlpParametros.versao)).first()
    new_version = (last_version.versao + 1) if last_version else 1
    
    new_param = TlpParametros(
        exercicio=param.exercicio,
        versao=new_version,
        custo_tlp_base=param.custo_tlp_base,
        ipca_percentual=param.ipca_percentual,
        subsidio_percentual=param.subsidio_percentual,
        limite_min_base=param.limite_min_base,
        limite_max_base=param.limite_max_base,
        limite_min_atualizado=param.limite_min_atualizado,
        limite_max_atualizado=param.limite_max_atualizado
    )
    
    try:
        db.add(new_param)
        db.commit()
        db.refresh(new_param)
        return new_param
    except Exception as e:
        print(f"Error creating parametro: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar parâmetro: {str(e)}")

# Simulações
class SimulacaoCreate(BaseModel):
    exercicio: int
    descricao: str
    custo_tlp_base: float
    ipca_percentual: Optional[float] = 0
    subsidio_percentual: Optional[float] = 0
    limite_min_base: Optional[float] = 0
    limite_max_base: Optional[float] = 0
    limite_min_atualizado: Optional[float] = 0
    limite_max_atualizado: Optional[float] = 0

@app.get("/simulacoes")
def get_simulacoes(db: Session = Depends(get_db)):
    try:
        from models import TlpSimulacao
        return db.query(TlpSimulacao).order_by(desc(TlpSimulacao.created_at)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar simulações: {str(e)}")

@app.post("/simulacoes")
def create_simulacao(sim: SimulacaoCreate, db: Session = Depends(get_db)):
    try:
        from models import TlpSimulacao
        
        # Monta o snapshot diretamente do payload (desacoplado de TlpParametros)
        snapshot = {
            "custo_tlp_base": sim.custo_tlp_base,
            "ipca_percentual": sim.ipca_percentual,
            "subsidio_percentual": sim.subsidio_percentual,
            "limite_min_base": sim.limite_min_base,
            "limite_max_base": sim.limite_max_base,
            "limite_min_atualizado": sim.limite_min_atualizado,
            "limite_max_atualizado": sim.limite_max_atualizado
        }
        
        new_sim = TlpSimulacao(
            exercicio=sim.exercicio,
            descricao=sim.descricao,
            status='RASCUNHO',
            parametros_snapshot=snapshot
        )
        
        db.add(new_sim)
        db.commit()
        db.refresh(new_sim)
        return new_sim
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar simulação: {str(e)}")


# ============== LOTES DE LANÇAMENTO ==============
class LoteCreate(BaseModel):
    id_simulacao_origem: str

@app.get("/lotes")
def get_lotes(db: Session = Depends(get_db)):
    try:
        from models import TlpLoteLancamento
        return db.query(TlpLoteLancamento).order_by(desc(TlpLoteLancamento.created_at)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar lotes: {str(e)}")

@app.get("/lotes/ultimo/{exercicio}")
def get_ultimo_lote(exercicio: int, db: Session = Depends(get_db)):
    """Busca o último lote oficial de um exercício específico para usar como base para o próximo ano."""
    try:
        from models import TlpLoteLancamento
        
        lote = db.query(TlpLoteLancamento).filter(
            TlpLoteLancamento.exercicio == exercicio
        ).order_by(desc(TlpLoteLancamento.versao)).first()
        
        if not lote:
            return None
        
        # Retorna os limites atualizados que servirão de base para o próximo ano
        return {
            "exercicio": lote.exercicio,
            "versao": lote.versao,
            "limite_min_atualizado": float(lote.parametros_snapshot.get("limite_min_atualizado", 0)) if lote.parametros_snapshot else 0,
            "limite_max_atualizado": float(lote.parametros_snapshot.get("limite_max_atualizado", 0)) if lote.parametros_snapshot else 0,
            "ipca_percentual": float(lote.parametros_snapshot.get("ipca_percentual", 0)) if lote.parametros_snapshot else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar último lote: {str(e)}")

@app.post("/lotes")
def create_lote(lote: LoteCreate, db: Session = Depends(get_db)):
    """Promove uma simulação para Lote de Lançamento Oficial."""
    try:
        from models import TlpSimulacao, TlpLoteLancamento
        import uuid
        
        sim = db.query(TlpSimulacao).filter(TlpSimulacao.id_simulacao == uuid.UUID(lote.id_simulacao_origem)).first()
        if not sim:
            raise HTTPException(status_code=404, detail="Simulação não encontrada")
        
        # Verifica ultima versão para esse exercicio
        last_version = db.query(TlpLoteLancamento).filter(TlpLoteLancamento.exercicio == sim.exercicio).order_by(desc(TlpLoteLancamento.versao)).first()
        new_version = (last_version.versao + 1) if last_version else 1
        
        new_lote = TlpLoteLancamento(
            exercicio=sim.exercicio,
            versao=new_version,
            id_simulacao_origem=sim.id_simulacao,
            parametros_snapshot=sim.parametros_snapshot,
            status='GERADO'
        )
        
        # Atualiza status da simulação
        sim.status = 'CONVERTIDO_LOTE'
        
        db.add(new_lote)
        db.commit()
        db.refresh(new_lote)
        return new_lote
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar lote: {str(e)}")


# ============== NÃO INCIDÊNCIA ==============
class NaoIncidenciaCreate(BaseModel):
    codg_inscricao_lan: str
    exercicio: int
    motivo: Optional[str] = None
    origem: Optional[str] = None

@app.get("/nao-incidencia")
def get_nao_incidencia(db: Session = Depends(get_db)):
    try:
        from models import TlpNaoIncidencia
        return db.query(TlpNaoIncidencia).filter(TlpNaoIncidencia.ativo == True).order_by(desc(TlpNaoIncidencia.created_at)).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar não incidências: {str(e)}")

@app.post("/nao-incidencia")
def create_nao_incidencia(ni: NaoIncidenciaCreate, db: Session = Depends(get_db)):
    try:
        from models import TlpNaoIncidencia
        
        new_ni = TlpNaoIncidencia(
            codg_inscricao_lan=ni.codg_inscricao_lan,
            exercicio=ni.exercicio,
            motivo=ni.motivo,
            origem=ni.origem,
            ativo=True
        )
        
        db.add(new_ni)
        db.commit()
        db.refresh(new_ni)
        return new_ni
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar não incidência: {str(e)}")


# ============== PROCESSAMENTO DE SIMULAÇÃO (CÁLCULO TLP) ==============

# Fatores por tipo de uso
FATORES_USO = {
    'RESIDENCIAL': 1.0,
    'SERVICO': 1.2,
    'COMERCIO': 1.5,
    'INDUSTRIA': 2.0,
    'PUBLICO/FILANTROPICO': 0,
    'PUBLICO': 0,
    'FILANTROPICO': 0
}

@app.post("/simulacoes/{id_simulacao}/processar")
def processar_simulacao(id_simulacao: str, db: Session = Depends(get_db)):
    """Processa a simulação: calcula TLP para cada imóvel e salva os resultados."""
    try:
        from models import TlpSimulacao, TlpSimulacaoItem, TlpNaoIncidencia, UsoImovel
        from decimal import Decimal
        
        # 1. Buscar simulação
        sim = db.query(TlpSimulacao).filter(TlpSimulacao.id_simulacao == id_simulacao).first()
        if not sim:
            raise HTTPException(status_code=404, detail="Simulação não encontrada")
        
        if sim.status == 'CONCLUIDO':
            raise HTTPException(status_code=400, detail="Simulação já foi processada")
        
        # Atualiza status
        sim.status = 'EM_PROCESSAMENTO'
        db.commit()
        
        # 2. Extrair parâmetros do snapshot
        params = sim.parametros_snapshot or {}
        custo_final = Decimal(str(params.get('custo_final', 0) or params.get('custo_tlp_base', 0)))
        limite_min = Decimal(str(params.get('limite_min_atualizado', 258)))
        limite_max = Decimal(str(params.get('limite_max_atualizado', 1600.08)))
        exercicio = sim.exercicio
        
        # 3. Buscar não incidências do exercício
        nao_incidencias = db.query(TlpNaoIncidencia).filter(
            TlpNaoIncidencia.exercicio == exercicio,
            TlpNaoIncidencia.ativo == True
        ).all()
        inscricoes_isentas = {ni.codg_inscricao_lan: ni.motivo for ni in nao_incidencias}
        
        # 4. Buscar todos os imóveis da view
        imoveis = db.query(UsoImovel).all()
        total_imoveis = len(imoveis)
        
        if total_imoveis == 0:
            raise HTTPException(status_code=400, detail="Nenhum imóvel encontrado na base")
        
        # 5. Calcular TLP base por imóvel
        # Fórmula: TLP_Bruta = Custo_Final / Total_Imoveis (distribuição uniforme)
        tlp_base_por_imovel = custo_final / Decimal(total_imoveis)
        
        # 6. Limpar itens anteriores (se reprocessando)
        db.query(TlpSimulacaoItem).filter(TlpSimulacaoItem.id_simulacao == sim.id_simulacao).delete()
        
        # 7. Calcular e inserir itens
        itens_criados = 0
        for imovel in imoveis:
            uso = (imovel.uso_classificado or 'RESIDENCIAL').upper()
            fator = Decimal(str(FATORES_USO.get(uso, 1.0)))
            
            # TLP Bruta = Base × Fator
            tlp_bruta = tlp_base_por_imovel * fator
            
            # Verificar não incidência
            is_isento = imovel.codg_inscricao_lan in inscricoes_isentas
            motivo_isencao = inscricoes_isentas.get(imovel.codg_inscricao_lan) if is_isento else None
            
            # Verificar se uso é público (isento por padrão)
            if uso in ['PUBLICO', 'FILANTROPICO', 'PUBLICO/FILANTROPICO']:
                is_isento = True
                motivo_isencao = motivo_isencao or 'PROPRIEDADE PÚBLICA/FILANTRÓPICA'
            
            # Aplicar limites (min/max) - somente se não isento
            if is_isento:
                tlp_calculada = Decimal('0')
            else:
                tlp_calculada = max(limite_min, min(limite_max, tlp_bruta))
            
            # Criar item
            item = TlpSimulacaoItem(
                id_simulacao=sim.id_simulacao,
                codg_inscricao_lan=imovel.codg_inscricao_lan,
                nome_contribuinte=imovel.nome_contribuinte_lan,
                uso_classificado=uso,
                atividade_considerada=imovel.atividade_considerada,
                fator_uso=fator,
                tlp_bruta=tlp_bruta,
                tlp_calculada=tlp_calculada,
                nao_incidencia=is_isento,
                motivo_nao_incidencia=motivo_isencao
            )
            db.add(item)
            itens_criados += 1
        
        # 8. Atualizar status da simulação
        sim.status = 'CONCLUIDO'
        db.commit()
        
        return {
            "message": "Simulação processada com sucesso",
            "total_imoveis": total_imoveis,
            "itens_criados": itens_criados
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        # Tentar reverter status
        try:
            sim = db.query(TlpSimulacao).filter(TlpSimulacao.id_simulacao == id_simulacao).first()
            if sim:
                sim.status = 'ERRO'
                db.commit()
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Erro ao processar simulação: {str(e)}")


@app.get("/simulacoes/{id_simulacao}/resultado")
def get_resultado_simulacao(id_simulacao: str, db: Session = Depends(get_db)):
    """Retorna estatísticas do resultado da simulação."""
    try:
        from models import TlpSimulacao, TlpSimulacaoItem
        from sqlalchemy import func as sqlfunc
        
        # Verificar se simulação existe
        sim = db.query(TlpSimulacao).filter(TlpSimulacao.id_simulacao == id_simulacao).first()
        if not sim:
            raise HTTPException(status_code=404, detail="Simulação não encontrada")
        
        # Estatísticas gerais
        stats = db.query(
            sqlfunc.count(TlpSimulacaoItem.id_item).label('total_imoveis'),
            sqlfunc.sum(TlpSimulacaoItem.tlp_calculada).label('total_arrecadado'),
            sqlfunc.avg(TlpSimulacaoItem.tlp_calculada).label('media_tlp'),
            sqlfunc.min(TlpSimulacaoItem.tlp_calculada).label('min_tlp'),
            sqlfunc.max(TlpSimulacaoItem.tlp_calculada).label('max_tlp'),
            sqlfunc.sum(sqlfunc.cast(TlpSimulacaoItem.nao_incidencia, Integer)).label('total_isentos')
        ).filter(TlpSimulacaoItem.id_simulacao == id_simulacao).first()
        
        # Distribuição por uso
        por_uso = db.query(
            TlpSimulacaoItem.uso_classificado,
            sqlfunc.count(TlpSimulacaoItem.id_item).label('quantidade'),
            sqlfunc.sum(TlpSimulacaoItem.tlp_calculada).label('total')
        ).filter(
            TlpSimulacaoItem.id_simulacao == id_simulacao
        ).group_by(TlpSimulacaoItem.uso_classificado).all()
        
        return {
            "simulacao": {
                "id": str(sim.id_simulacao),
                "exercicio": sim.exercicio,
                "descricao": sim.descricao,
                "status": sim.status,
                "parametros": sim.parametros_snapshot
            },
            "estatisticas": {
                "total_imoveis": stats.total_imoveis or 0,
                "total_arrecadado": float(stats.total_arrecadado or 0),
                "media_tlp": float(stats.media_tlp or 0),
                "min_tlp": float(stats.min_tlp or 0),
                "max_tlp": float(stats.max_tlp or 0),
                "total_isentos": stats.total_isentos or 0
            },
            "por_uso": [
                {"uso": row.uso_classificado, "quantidade": row.quantidade, "total": float(row.total or 0)}
                for row in por_uso
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar resultado: {str(e)}")


@app.get("/simulacoes/{id_simulacao}/itens")
def get_itens_simulacao(id_simulacao: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista itens calculados de uma simulação (paginado)."""
    try:
        from models import TlpSimulacaoItem
        
        itens = db.query(TlpSimulacaoItem).filter(
            TlpSimulacaoItem.id_simulacao == id_simulacao
        ).order_by(TlpSimulacaoItem.tlp_calculada.desc()).offset(skip).limit(limit).all()
        
        return itens
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar itens: {str(e)}")


from sqlalchemy import Column, String, Integer, Numeric, Boolean, BigInteger, DateTime, func, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from database import Base

class ImovelBase(Base):
    __tablename__ = 'vw_imovel_base'
    __table_args__ = {'schema': 'tlp'}

    codg_inscricao_lan = Column(String, primary_key=True)
    nome_contribuinte_lan = Column(String)
    codg_bairro_imovel_lan = Column(Integer)
    codg_lograd_imovel_lan = Column(Integer)
    qtde_area_edificada_lan = Column(Numeric)
    info_uso_lan = Column(Integer)
    info_ocupacao_lan = Column(Integer)
    info_propriedade_lan = Column(Integer)

class UsoImovel(Base):
    __tablename__ = 'vw_uso_imovel_por_inscricao'
    __table_args__ = {'schema': 'tlp'}

    codg_inscricao_lan = Column(String, primary_key=True)
    nome_contribuinte_lan = Column(String)
    uso_classificado = Column(String)
    atividade_considerada = Column(String)
    tem_servico = Column(Boolean)
    tem_comercio = Column(Boolean)
    tem_industria = Column(Boolean)
    qtde_empresas_distintas = Column(Integer)
    qtde_cnaes_distintos = Column(Integer)

class TlpParametros(Base):
    __tablename__ = 'tlp_parametros'
    __table_args__ = {'schema': 'tlp'}

    id_parametro = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exercicio = Column(Integer, nullable=False)
    versao = Column(Integer, default=1)
    custo_tlp_base = Column(Numeric(10, 2), nullable=False)
    ipca_percentual = Column(Numeric(5, 2))
    subsidio_percentual = Column(Numeric(5, 2))
    limite_min_base = Column(Numeric(10, 2))
    limite_max_base = Column(Numeric(10, 2))
    limite_min_atualizado = Column(Numeric(10, 2))
    limite_max_atualizado = Column(Numeric(10, 2))
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TlpSimulacao(Base):
    __tablename__ = 'tlp_simulacao'
    __table_args__ = {'schema': 'tlp'}

    id_simulacao = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exercicio = Column(Integer, nullable=False)
    status = Column(Text, default='RASCUNHO') # RASCUNHO, EM_PROCESSAMENTO, CONCLUIDO, ERRO
    descricao = Column(Text)
    parametros_snapshot = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())

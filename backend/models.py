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
    custo_tlp_base = Column(Numeric(18, 2), nullable=False)
    ipca_percentual = Column(Numeric(5, 2))
    subsidio_percentual = Column(Numeric(5, 2))
    limite_min_base = Column(Numeric(18, 2))
    limite_max_base = Column(Numeric(18, 2))
    limite_min_atualizado = Column(Numeric(18, 2))
    limite_max_atualizado = Column(Numeric(18, 2))
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


class TlpLoteLancamento(Base):
    """Lote de Lançamento Oficial - Conversão de uma Simulação aprovada."""
    __tablename__ = 'tlp_lote_lancamento'
    __table_args__ = {'schema': 'tlp'}

    id_lote = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exercicio = Column(Integer, nullable=False)
    versao = Column(Integer, default=1)
    id_simulacao_origem = Column(UUID(as_uuid=True), nullable=True)
    parametros_snapshot = Column(JSONB, default={})
    status = Column(Text, default='GERADO')  # GERADO, PROCESSADO, ENVIADO
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TlpNaoIncidencia(Base):
    """Cadastro de imóveis isentos/imunes (não incidência)."""
    __tablename__ = 'tlp_nao_incidencia'
    __table_args__ = {'schema': 'tlp'}

    id_nao_incidencia = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codg_inscricao_lan = Column(String, nullable=False, index=True)
    exercicio = Column(Integer, nullable=False)
    motivo = Column(Text)
    origem = Column(String)  # JUDICIAL, ADMINISTRATIVO, LEI
    ativo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TlpSimulacaoItem(Base):
    """Resultado do cálculo TLP por imóvel em uma simulação."""
    __tablename__ = 'tlp_simulacao_item'
    __table_args__ = {'schema': 'tlp'}

    id_item = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_simulacao = Column(UUID(as_uuid=True), nullable=False, index=True)
    codg_inscricao_lan = Column(String, nullable=False, index=True)
    nome_contribuinte = Column(String)
    uso_classificado = Column(String)
    atividade_considerada = Column(String)
    fator_uso = Column(Numeric(5, 2), default=1.0)
    tlp_bruta = Column(Numeric(18, 2))
    tlp_calculada = Column(Numeric(18, 2))
    nao_incidencia = Column(Boolean, default=False)
    motivo_nao_incidencia = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())



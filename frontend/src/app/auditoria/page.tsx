'use client';

import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function AuditoriaPage() {
    const [inscricao, setInscricao] = useState('');
    const [dados, setDados] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const buscarDossie = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setDados(null);
        try {
            const response = await axios.get(`http://localhost:8000/imoveis/${inscricao}`);
            setDados(response.data);
        } catch (err) {
            alert('Imóvel não encontrado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-premium">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Auditoria de Lançamento</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Rastreabilidade e memória de cálculo por inscrição.</p>
            </header>

            <Card style={{ marginBottom: '2rem' }}>
                <CardContent>
                    <form onSubmit={buscarDossie} style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
                        <div style={{ flex: 1 }}>
                            <Input
                                label="Inscrição para Auditoria"
                                placeholder="Ex: 10100100970000"
                                value={inscricao}
                                onChange={e => setInscricao(e.target.value)}
                            />
                        </div>
                        <Button type="submit" isLoading={loading}>Gerar Dossiê</Button>
                    </form>
                </CardContent>
            </Card>

            {dados && (
                <div className="fade-in" style={{ display: 'grid', gap: '1.5rem' }}>

                    {/* 1. Dados Cadastrais Originais */}
                    <Card>
                        <CardHeader><CardTitle>1. Dados Cadastrais (Origem: Cadastro Imobiliário)</CardTitle></CardHeader>
                        <CardContent>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
                                <div><p className="text-gray-500">Contribuinte</p><p className="font-medium">{dados.nome_contribuinte_lan}</p></div>
                                <div><p className="text-gray-500">Endereço (Cod)</p><p className="font-medium">{dados.codg_lograd_imovel_lan}</p></div>
                                <div><p className="text-gray-500">Bairro (Cod)</p><p className="font-medium">{dados.codg_bairro_imovel_lan}</p></div>
                                <div><p className="text-gray-500">Área Edificada</p><p className="font-medium">{dados.qtde_area_edificada_lan} m²</p></div>
                                <div><p className="text-gray-500">Uso Original (Cadastro)</p><p className="font-medium">{dados.info_uso_lan}</p></div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Análise de Atividade Econômica */}
                    <Card>
                        <CardHeader><CardTitle>2. Análise de Atividade Econômica (Origem: Cadastro Mobiliário)</CardTitle></CardHeader>
                        <CardContent>
                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{dados.qtde_empresas_distintas}</p>
                                    <p className="text-sm text-gray-500">Empresas Vinculadas</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{dados.qtde_cnaes_distintos}</p>
                                    <p className="text-sm text-gray-500">CNAEs Ativos</p>
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem' }}>
                                <h4 className="font-semibold mb-2 text-sm">Flags de Atividade Identificadas:</h4>
                                <div className="flex gap-2">
                                    <span className={`px-2 py-1 rounded text-xs border ${dados.tem_servico ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-gray-50 text-gray-400'}`}>SERVIÇO</span>
                                    <span className={`px-2 py-1 rounded text-xs border ${dados.tem_comercio ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-gray-50 text-gray-400'}`}>COMÉRCIO</span>
                                    <span className={`px-2 py-1 rounded text-xs border ${dados.tem_industria ? 'bg-orange-50 border-orange-200 text-orange-700 font-bold' : 'bg-gray-50 text-gray-400'}`}>INDÚSTRIA</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Conclusão da Regra de Negócio */}
                    <Card style={{ borderLeft: '4px solid var(--primary-600)' }}>
                        <CardHeader><CardTitle>3. Conclusão do Algoritmo</CardTitle></CardHeader>
                        <CardContent>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <p className="text-sm text-gray-500">Regra Aplicada</p>
                                    <p className="font-medium">Hierarquia de Uso (Indústria {'>'} Comércio {'>'} Serviço {'>'} Residencial)</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Resultado Final</p>
                                    <p className="text-xl font-bold text-blue-700">{dados.uso_classificado}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

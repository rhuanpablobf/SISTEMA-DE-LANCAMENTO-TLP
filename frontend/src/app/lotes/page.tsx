'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface Lote {
    id_lote: string;
    exercicio: number;
    versao: number;
    status: string;
    id_simulacao_origem: string;
    created_at: string;
    parametros_snapshot: any;
}

export default function LotesPage() {
    const [list, setList] = useState<Lote[]>([]);
    const [loading, setLoading] = useState(true);

    const loadList = async () => {
        try {
            const response = await api.get('/lotes');
            setList(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadList();
    }, []);

    const statusColor = (status: string) => {
        switch (status) {
            case 'GERADO': return 'bg-blue-100 text-blue-700';
            case 'PROCESSADO': return 'bg-green-100 text-green-700';
            case 'ENVIADO': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div className="container-premium">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Lotes de Lançamento</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Lotes oficiais gerados a partir das simulações aprovadas.</p>
            </header>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {loading ? <p>Carregando...</p> : list.length === 0 ? (
                    <Card>
                        <CardContent><p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Nenhum lote gerado ainda. Crie uma simulação e converta em lote.</p></CardContent>
                    </Card>
                ) : list.map((item) => (
                    <Card key={item.id_lote}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Lote {item.exercicio} - v{item.versao}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    Gerado em {new Date(item.created_at).toLocaleDateString()} às {new Date(item.created_at).toLocaleTimeString()}
                                </p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                    Origem: Simulação {item.id_simulacao_origem?.substring(0, 8) || '-'}...
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button variant="outline" size="sm">Exportar CSV</Button>
                                <Button variant="outline" size="sm">Ver Detalhes</Button>
                            </div>
                        </div>
                        {/* Snapshot info */}
                        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            <span>Custo Base: <strong>{Number(item.parametros_snapshot?.custo_tlp_base || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
                            <span>IPCA: <strong>{item.parametros_snapshot?.ipca_percentual || 0}%</strong></span>
                            <span>Subsídio: <strong>{item.parametros_snapshot?.subsidio_percentual || 0}%</strong></span>
                            <span>Limite Min: <strong>{Number(item.parametros_snapshot?.limite_min_atualizado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
                            <span>Limite Max: <strong>{Number(item.parametros_snapshot?.limite_max_atualizado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

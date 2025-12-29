'use client';

import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function Home() {
  const [inscricao, setInscricao] = useState('');
  const [dados, setDados] = useState<any>(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const buscarImovel = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setDados(null);

    try {
      const response = await axios.get(`http://localhost:8000/imoveis/${inscricao}`);
      setDados(response.data);
    } catch (err) {
      setErro('Imóvel não encontrado ou erro na comunicação. Verifique a inscrição.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-premium">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Bem-vindo ao sistema de gestão TLP.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        {/* Lado Esquerdo: Busca */}
        <div style={{ gridColumn: 'span 4' }}>
          <Card>
            <CardHeader>
              <CardTitle>Consultar Imóvel</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={buscarImovel}>
                <Input
                  label="Inscrição Imobiliária"
                  placeholder="Ex: 10100100970000"
                  value={inscricao}
                  onChange={(e) => setInscricao(e.target.value)}
                  error={erro}
                />

                <div style={{ marginTop: '1rem' }}>
                  <Button type="submit" isLoading={loading} style={{ width: '100%' }}>
                    Buscar Detalhes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Atalhos Rápidos (Placeholder) */}
          <div style={{ marginTop: '1.5rem' }}>
            <Card>
              <CardHeader><CardTitle>Acesso Rápido</CardTitle></CardHeader>
              <CardContent>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Button variant="secondary" size="sm">Nova Simulação</Button>
                  <Button variant="secondary" size="sm">Ver Parâmetros</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lado Direito: Resultados */}
        <div style={{ gridColumn: 'span 8' }}>
          {dados ? (
            <Card className="fade-in">
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <CardTitle>{dados.nome_contribuinte_lan}</CardTitle>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Inscrição: {dados.codg_inscricao_lan}</p>
                  </div>
                  <span style={{
                    backgroundColor: 'var(--primary-100)',
                    color: 'var(--primary-700)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    ATIVO
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Classificação de Uso</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{dados.uso_classificado}</p>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-body)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Atividade Considerada</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{dados.atividade_considerada}</p>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>Indicadores de Atividade</h4>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <StatusBadge label="Serviço" active={dados.tem_servico} color="var(--success)" />
                    <StatusBadge label="Comércio" active={dados.tem_comercio} color="var(--primary-500)" />
                    <StatusBadge label="Indústria" active={dados.tem_industria} color="var(--warning)" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #e2e8f0',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-secondary)',
              minHeight: '400px',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ fontSize: '3rem', opacity: 0.2 }}>🔍</div>
              <p>Realize uma busca para visualizar os detalhes do imóvel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const StatusBadge = ({ label, active, color }: { label: string, active: boolean, color: string }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    opacity: active ? 1 : 0.4,
    fontWeight: active ? 600 : 400
  }}>
    <div style={{
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: active ? color : '#cbd5e1'
    }} />
    <span style={{ fontSize: '0.875rem' }}>{label}</span>
  </div>
);

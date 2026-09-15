import React from 'react';
import { StudentPortfolioReport } from '../types/report';

interface PrintablePortfolioReportProps {
  portfolio: StudentPortfolioReport;
  timestampText: string;
}

export const PrintablePortfolioReport: React.FC<PrintablePortfolioReportProps> = ({
  portfolio,
  timestampText,
}) => {
  const dateFormatted = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div
      id="pdf-printable-portfolio"
      style={{
        width: '210mm',
        backgroundColor: '#ffffff',
        color: '#1e293b',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ==================== SEITE 1 ==================== */}
      <div
        className="portfolio-page"
        style={{
          width: '210mm',
          height: '296.5mm',
          boxSizing: 'border-box',
          padding: '14mm 18mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Offizieller Kopfbereich mit Schulsiegel */}
          <div
            style={{
              borderBottom: '2px solid #00558F',
              paddingBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src="/Siegel_bunt.png"
                  alt="Siegel Heimbürgeschule Kahla"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    color: '#64748b',
                    display: 'block',
                  }}
                >
                  Staatliche Regelschule »Heimbürgeschule« Kahla
                </span>
                <h1
                  style={{
                    fontSize: '18px',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    color: '#00558F',
                    lineHeight: 1.15,
                    textTransform: 'uppercase',
                    margin: '2px 0',
                  }}
                >
                  Portfolio-Entwicklungsbericht
                </h1>
                <p style={{ fontSize: '11px', color: '#0B7BA7', fontWeight: 600, margin: 0 }}>
                  Projekt »Tag in der Praxis« • Thüringer Berufsorientierung
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: '#00558F',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  maxWidth: '180px',
                  whiteSpace: 'normal',
                  textAlign: 'center',
                  lineHeight: 1.25,
                }}
              >
                {portfolio.periodCovered || 'Turnus-Portfolio'}
              </span>
              <span style={{ display: 'block', fontSize: '9px', color: '#64748b', marginTop: '3px' }}>
                Ausgestellt am {dateFormatted}
              </span>
            </div>
          </div>

          {/* Stammdaten des Schülers & Betriebe */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '10px 12px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#00558F',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '4px',
                marginBottom: '6px',
              }}
            >
              Schüler- und Stammdaten
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                fontSize: '11px',
              }}
            >
              <div style={{ gridColumn: 'span 2' }}>
                <span
                  style={{
                    color: '#64748b',
                    display: 'block',
                    fontSize: '9px',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Name des Schülers:
                </span>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                  {portfolio.studentName || '—'}
                </span>
              </div>
              <div>
                <span
                  style={{
                    color: '#64748b',
                    display: 'block',
                    fontSize: '9px',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Klasse:
                </span>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                  Klasse {portfolio.studentClass || '—'}
                </span>
              </div>
              <div>
                <span
                  style={{
                    color: '#64748b',
                    display: 'block',
                    fontSize: '9px',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Schuljahr(e):
                </span>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                  {portfolio.schoolYears || 'Aktuell'}
                </span>
              </div>
              <div style={{ gridColumn: 'span 4', paddingTop: '4px', borderTop: '1px solid #e2e8f0' }}>
                <span
                  style={{
                    color: '#64748b',
                    display: 'block',
                    fontSize: '9px',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Beteiligte Praxisbetriebe:
                </span>
                <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '11px' }}>
                  {portfolio.companiesInvolved && portfolio.companiesInvolved.length > 0
                    ? portfolio.companiesInvolved.join(' • ')
                    : 'Praktikumsbetriebe der Region'}
                </span>
              </div>
            </div>
          </div>

          {/* Pädagogische Gesamteinschätzung (Summary) */}
          {portfolio.summary && (
            <div
              style={{
                backgroundColor: '#f0f9ff',
                borderLeft: '4px solid #0B7BA7',
                padding: '9px 12px',
                borderRadius: '0 6px 6px 0',
                fontSize: '11px',
                lineHeight: 1.45,
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: '#00558F',
                  display: 'block',
                  marginBottom: '2px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  fontSize: '9px',
                }}
              >
                Pädagogische Gesamteinschätzung der Betreuungslehrkraft:
              </span>
              <p style={{ color: '#1e293b', fontStyle: 'italic', margin: 0, fontSize: '11px' }}>
                {portfolio.summary}
              </p>
            </div>
          )}

          {/* I. Durchlaufene Berufsfelder & Tätigkeiten */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '10px 12px',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: '#00558F',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '4px',
                marginBottom: '6px',
              }}
            >
              I. Durchlaufene Berufsfelder & Tätigkeitsbereiche
            </div>
            <div
              style={{
                color: '#1e293b',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.45,
                fontSize: '11px',
              }}
            >
              {portfolio.practicalExperience || 'Keine Angaben hinterlegt.'}
            </div>
          </div>

          {/* II. Beobachtete Schlüsselkompetenzen & Stärken */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '10px 12px',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: '#00558F',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '4px',
                marginBottom: '6px',
              }}
            >
              II. Beobachtete Schlüsselkompetenzen & Stärken
            </div>

            {portfolio.competenciesAndStrengths && portfolio.competenciesAndStrengths.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '6px',
                  paddingTop: '2px',
                }}
              >
                {portfolio.competenciesAndStrengths.map((strength, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '7px 9px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: '#0B7BA7',
                        fontSize: '12px',
                        lineHeight: 1,
                        marginTop: '1px',
                      }}
                    >
                      ▪
                    </span>
                    <span style={{ color: '#1e293b', lineHeight: 1.35 }}>{strength}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '10.5px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                Keine gesonderten Stärken dokumentiert.
              </p>
            )}
          </div>
        </div>

        {/* Footer Seite 1 */}
        <div
          style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '6px',
            fontSize: '9px',
            color: '#94a3b8',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            Staatliche Regelschule »Heimbürgeschule« Kahla • Offizieller Nachweis zum Berufswahl-Portfolio
          </span>
          <span>Seite 1 von 2 • {timestampText}</span>
        </div>
      </div>

      {/* ==================== SEITENUMBRUCH FÜR HTML2PDF ==================== */}
      <div
        className="html2pdf__page-break"
        style={{
          pageBreakBefore: 'always',
          breakBefore: 'page',
          height: 0,
          margin: 0,
          padding: 0,
        }}
      />

      {/* ==================== SEITE 2 ==================== */}
      <div
        className="portfolio-page"
        style={{
          width: '210mm',
          height: '296.5mm',
          boxSizing: 'border-box',
          padding: '14mm 18mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Dezenter Kopfbereich Seite 2 */}
          <div
            style={{
              borderBottom: '2px solid #00558F',
              paddingBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src="/Siegel_bunt.png"
                  alt="Siegel Heimbürgeschule Kahla"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: '#00558F',
                    display: 'block',
                  }}
                >
                  Staatliche Regelschule »Heimbürgeschule« Kahla
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b' }}>
                  Portfolio-Entwicklungsbericht • Seite 2
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '10.5px', color: '#475569' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{portfolio.studentName || '—'}</span>
              <span style={{ display: 'block', fontSize: '9.5px', color: '#64748b' }}>
                Klasse {portfolio.studentClass || '—'} • {portfolio.periodCovered || 'Turnus-Portfolio'}
              </span>
            </div>
          </div>

          {/* III. Lernzuwachs, Reifegrad & Reflexionskompetenz */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '10px 12px',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: '#00558F',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '4px',
                marginBottom: '6px',
              }}
            >
              III. Lernzuwachs, Reifegrad & Reflexionskompetenz
            </div>
            <div
              style={{
                color: '#1e293b',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
                fontSize: '11px',
              }}
            >
              {portfolio.developmentAndReflection || 'Keine Angaben hinterlegt.'}
            </div>
          </div>

          {/* IV. Empfehlungen zur Berufswahl & Abschlussvotum */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '10px 12px',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: '#00558F',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '4px',
                marginBottom: '6px',
              }}
            >
              IV. Empfehlungen zur Berufswahl & Abschlussvotum
            </div>
            <div
              style={{
                color: '#1e293b',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {portfolio.careerRecommendations && (
                <div>
                  <strong
                    style={{
                      color: '#0f172a',
                      display: 'block',
                      fontSize: '10.5px',
                      marginBottom: '2px',
                    }}
                  >
                    Empfohlene Berufsfelder & nächste Schritte:
                  </strong>
                  <p style={{ margin: 0 }}>{portfolio.careerRecommendations}</p>
                </div>
              )}
              {portfolio.overallConclusion && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                  <strong
                    style={{
                      color: '#0f172a',
                      display: 'block',
                      fontSize: '10.5px',
                      marginBottom: '2px',
                    }}
                  >
                    Abschließende Beurteilung der Schule:
                  </strong>
                  <p style={{ margin: 0 }}>{portfolio.overallConclusion}</p>
                </div>
              )}
            </div>
          </div>

          {/* Offizieller Unterschriftenbereich */}
          <div style={{ borderTop: '2px solid #cbd5e1', paddingTop: '16px', marginTop: '10px' }}>
            <div style={{ maxWidth: '340px', fontSize: '11px', color: '#334155' }}>
              <span style={{ display: 'block', marginBottom: '32px', color: '#475569' }}>
                Kahla, den {dateFormatted}
              </span>
              <div
                style={{
                  borderTop: '1px solid #475569',
                  paddingTop: '6px',
                  fontWeight: 600,
                  color: '#0f172a',
                  textAlign: 'center',
                }}
              >
                Unterschrift der betreuenden Lehrkraft für Berufsorientierung
              </div>
            </div>
          </div>
        </div>

        {/* Footer Seite 2 */}
        <div
          style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '6px',
            fontSize: '9px',
            color: '#94a3b8',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            Staatliche Regelschule »Heimbürgeschule« Kahla • Offizieller Nachweis zum Berufswahl-Portfolio
          </span>
          <span>Seite 2 von 2 • {timestampText}</span>
        </div>
      </div>
    </div>
  );
};

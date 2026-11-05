# Extensão — FE-014

Editais, inscrições, atividades, horas e certificados.

## Certificados Digitais e Validação por Hash/QR Code (FE-014)

Módulo responsável pela emissão, download e validação pública de certificados eletrônicos:
- Listagem dos certificados emitidos para o estudante com categoria, horas complementares e data.
- Download direto do documento eletrônico contendo chaves criptográficas de autenticidade.
- Validação pública de autenticidade através do código hash SHA-256 ou leitura da URL contida no QR Code.
- Verificação de status institucional:
  - **Válido (VALID)**: Exibe selo de conformidade e todos os metadados acadêmicos oficiais.
  - **Revogado (REVOKED)**: Exibe alerta de cancelamento pela diretoria acadêmica.
  - **Não localizado (NOT_FOUND)**: Exibe mensagem acessível de código não encontrado.

## Fronteira de Integração com Backend (BE-017 / SPEC-EXT-003)

- **Dependência**: `BE-017` (Certificado possui hash/QR verificável e emissão autorizada; rastreado na issue #17 de `plataforma-backend`).
- **SPEC**: `SPEC-EXT-003` (Certificados).
- **Algoritmo**: SHA-256 (64 dígitos hexadecimais).
- **Validação Pública**: O endpoint `GET /api/certificados/validar?hash={hash}` permite consulta sem exigência de autenticação para fins de comprovação externa de títulos.

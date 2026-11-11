// Local HTTP fixture for consumer tests. Not the academic backend.
import { createServer } from 'node:http';
let mode = 'published';
let calls = 0;
let receivedCookie = false;
const server = createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:4101');
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Cache-Control', 'no-store');
  if (url.pathname === '/health') return response.end('{}');
  if (url.pathname === '/scenario' && request.method === 'POST') {
    mode = url.searchParams.get('mode'); calls = 0; receivedCookie = false;
    return response.end('{}');
  }
  if (url.pathname === '/stats') return response.end(JSON.stringify({ calls, receivedCookie }));
  if (url.pathname !== '/projects') { response.statusCode = 404; return response.end('{}'); }
  calls += 1; receivedCookie ||= Boolean(request.headers.cookie);
  if (mode === 'error') { response.statusCode = 503; return response.end('{"message":"SYNTHETIC_INTERNAL_ERROR"}'); }
  if (mode === 'invalid') return response.end('{"items":"invalid"}');
  const page = Number(url.searchParams.get('page'));
  const item = {
    id: 'api-fixture-1', title: 'Projeto de teste via HTTP', summary: 'Conteúdo público sintético do produtor de teste.',
    course: 'Engenharia Mecânica', semester: '2026.2', ods: [4, 9], published: mode !== 'draft',
    studentName: 'PRIVATE_STUDENT_SENTINEL', individualGrade: 9, hours: 100, files: ['PRIVATE_FILE_SENTINEL'],
  };
  const items = mode === 'withdrawn' || page > 1 ? [] : [item];
  response.end(JSON.stringify({ items, total: mode === 'withdrawn' ? 0 : 1, page, pageSize: 6 }));
});
server.listen(4101, '127.0.0.1');
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));

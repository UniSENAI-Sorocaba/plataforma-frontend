# FE-019 — métricas Web Vitals

O layout raiz inicializa o hook oficial `useReportWebVitals` do Next.js, sem transformar o layout SSR em componente cliente. O coletor filtra e envia somente LCP, INP e CLS. Em produção, o padrão é o endpoint do próprio frontend `POST /api/web-vitals`; em desenvolvimento, os valores aparecem no console para facilitar a inspeção local.

## Envio

O endpoint interno valida tipo, tamanho e campos permitidos e emite um registro JSON `event=web_vital` no log do processo. O payload contém identificador da métrica, nome, valor, delta, avaliação e tipo de navegação; não inclui URL, dados do usuário, cookies, credenciais ou endereço IP. O corpo tem limite de 2 KiB e somente LCP/INP/CLS são aceitos.

O navegador envia JSON por `sendBeacon` e usa `fetch(keepalive)` como fallback. Se um coletor externo for aprovado, `NEXT_PUBLIC_WEB_VITALS_ENDPOINT` pode substituí-lo; destinos externos precisam usar HTTPS. A falha do endpoint não interrompe a navegação.

## Metas de referência

Avaliar percentil 75 (p75) de usuários reais, separado por dispositivo quando houver volume suficiente:

- LCP: até 2.500 ms.
- INP: até 200 ms.
- CLS: até 0,1.

Os valores individuais são classificados pelo `rating` fornecido pelo Next.js. Os registros podem ser agregados nos logs do runtime para obter p75. Uma compilação local ou uma única navegação não prova que as metas foram atingidas; isso exige tráfego representativo após a implantação e análise dos logs.

## Dependência de implantação

INF-011 ainda precisa concluir o runtime SSR/CDN. A FE-019 implementa instrumentação e coleta por logs; validar as metas em produção depende da implantação, da geração de tráfego real e da análise dos percentis.

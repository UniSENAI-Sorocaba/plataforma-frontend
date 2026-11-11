"use client";
import { useState } from "react";
import { CPA_QUESTIONS, SCALE, validAnswers } from "./prototype";
export function CpaForm() {
  const [answers, setAnswers] = useState<number[]>([0, 0, 0]);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  if (complete) return <section className="panel" role="status"><h2>Prévia concluída.</h2><p>Nenhuma resposta foi enviada ou armazenada. Este é apenas um protótipo de interação.</p><button onClick={() => { setComplete(false); setAnswers([0, 0, 0]); }}>Explorar novamente</button></section>;
  return <form className="cpa-form" onSubmit={event => { event.preventDefault(); if (!validAnswers(answers)) { setError("Selecione uma resposta para cada pergunta."); return; } setAnswers([0, 0, 0]); setComplete(true); }}>
    {CPA_QUESTIONS.map((question, index) => <fieldset key={question}><legend><span className="question-number">0{index + 1}</span>{question}</legend><div className="rating-options">{SCALE.map((label, rating) => <label key={label}><input required type="radio" name={`question-${index}`} value={rating + 1} checked={answers[index] === rating + 1} onChange={() => { setError(""); setAnswers(current => current.map((answer, i) => i === index ? rating + 1 : answer)); }} /><span>{rating + 1}</span>{label}</label>)}</div></fieldset>)}
    {error ? <p role="alert">{error}</p> : null}<button type="submit">Concluir demonstração</button><p className="footnote">Sem nome, CPF, e-mail, texto livre ou vínculo com conta. As escolhas ficam apenas na memória desta tela e são descartadas ao concluir ou recarregar.</p></form>;
}

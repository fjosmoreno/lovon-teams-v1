// Test with an engineering task that previously generated 2023 dates
async function testAgentAPI() {
  const res = await fetch('http://localhost:3000/api/lovon/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentName: 'Engenharia Worker',
      agentRole: 'worker',
      department: 'Engenharia',
      specialty: 'Code & Architecture',
      mission: 'Lançar plataforma SaaS de gestão financeira para startups',
      taskTitle: 'Desenvolver MVP da plataforma financeira',
      taskDescription: 'Construir versão mínima com funcionalidades essenciais de controle financeiro para startups',
      companyName: 'Lovon Teams',
      mode: 'execute',
    }),
  });
  const data = await res.json();
  console.log('=== WARNINGS ===', JSON.stringify(data.warnings, null, 2));
  
  // Check for past dates
  const pastDatePattern = /(\d{1,2})\/(\d{1,2})\/202[0-4]/g;
  const found = (data.conclusion || '').match(pastDatePattern);
  console.log('=== PAST DATES FOUND ===', found);
  
  // Check for version numbers
  const versionPattern = /v\d+\.\d+\.\d+/gi;
  const versions = (data.conclusion || '').match(versionPattern);
  console.log('=== VERSION NUMBERS FOUND ===', versions);
  
  console.log('\n=== PRÓXIMOS PASSOS SECTION ===');
  const concl = data.conclusion || '';
  const nextStepsIdx = concl.indexOf('## Próximos Passos');
  if (nextStepsIdx >= 0) {
    console.log(concl.slice(nextStepsIdx, nextStepsIdx + 1000));
  }
}

testAgentAPI().catch(console.error);

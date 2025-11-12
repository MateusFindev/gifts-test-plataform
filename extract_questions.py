import json
import re

# Ler o arquivo de texto
with open('/home/ubuntu/upload/pasted_content.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Extrair seções de autoavaliação (1-6)
sections = []
for i in range(1, 7):
    pattern = rf'Seção {i}.*?Classificação:.*?\n(.*?)(?=Seção {i+1}|As perguntas abaixo|$)'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        sections.append(match.group(1))

# Extrair perguntas de autoavaliação
self_questions = []
for section_text in sections:
    # Encontrar todas as perguntas numeradas
    questions = re.findall(r'\d+\.\s*(.+?)(?=\n\d+\.|$)', section_text, re.DOTALL)
    for q in questions:
        # Limpar a pergunta
        clean_q = re.sub(r'\s+', ' ', q.strip())
        if clean_q:
            self_questions.append(clean_q)

# Extrair perguntas de avaliação externa
external_pattern = r'As perguntas abaixo.*?Em relação a.*?:\n(.*?)$'
external_match = re.search(external_pattern, content, re.DOTALL)
external_questions = []
if external_match:
    external_text = external_match.group(1)
    questions = re.findall(r'\d+\.\s*(.+?)(?=\n\d+\.|$)', external_text, re.DOTALL)
    for q in questions:
        clean_q = re.sub(r'\s+', ' ', q.strip())
        if clean_q:
            external_questions.append(clean_q)

# Salvar perguntas de autoavaliação
with open('shared/self_assessment_questions.json', 'w', encoding='utf-8') as f:
    json.dump(self_questions, f, ensure_ascii=False, indent=2)

# Salvar perguntas de avaliação externa
with open('shared/external_assessment_questions.json', 'w', encoding='utf-8') as f:
    json.dump(external_questions, f, ensure_ascii=False, indent=2)

print(f"Perguntas de autoavaliação extraídas: {len(self_questions)}")
print(f"Perguntas de avaliação externa extraídas: {len(external_questions)}")

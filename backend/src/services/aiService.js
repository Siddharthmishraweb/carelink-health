const env = require('../config/env');

const KNOWN_COMPLAINTS = [
  'fever',
  'cough',
  'headache',
  'body pain',
  'cold',
  'sore throat',
  'nausea',
  'vomiting',
  'chest pain',
  'breathlessness',
  'dizziness',
  'fatigue',
  'stomach pain',
];

function extractFromTranscript(transcript = '', clinicianNotes = '') {
  const text = `${transcript}\n${clinicianNotes}`.toLowerCase();
  const complaints = KNOWN_COMPLAINTS.filter((item) => text.includes(item));

  const durationMatch = text.match(/(\d+)\s*(day|days|week|weeks|month|months)/);
  const freqMatch = text.match(/(\d+)\s*times?\s*(a|per)?\s*day/);
  const followMatch = text.match(/follow[- ]?up.{0,20}(\d+)\s*day/);

  const medicines = [];
  const medLine = transcript.split('\n').filter((line) => /prescribe|tablet|mg|syrup|capsule/i.test(line));
  medLine.forEach((line) => {
    medicines.push({
      name: line.replace(/prescribe|please|tablet/gi, '').trim().slice(0, 40) || 'As stated by doctor',
      dosage: 'As prescribed by doctor',
      frequency: freqMatch ? `${freqMatch[1]} times/day` : 'As prescribed by doctor',
      duration: durationMatch ? `${durationMatch[1]} ${durationMatch[2]}` : 'As prescribed by doctor',
    });
  });

  return {
    complaints: complaints.length ? complaints.map((c) => c.replace(/\b\w/g, (m) => m.toUpperCase())) : [],
    history: {
      duration: durationMatch ? `${durationMatch[1]} ${durationMatch[2]}` : '',
      onset: text.includes('sudden') ? 'Sudden' : text.includes('gradual') ? 'Gradual' : '',
      previousHistory: '',
      existingMedications: [],
      allergies: [],
    },
    examination: clinicianNotes || '',
    assessment: '',
    prescription: medicines,
    followUp: followMatch ? `Follow-up recommended after ${followMatch[1]} days.` : '',
    disclaimer: 'AI-generated draft — Doctor review required.',
    generatedAt: new Date(),
    reviewed: false,
  };
}

async function generateDraft({ transcript, clinicianNotes }) {
  if (env.aiProvider === 'openai' && env.openaiKey) {
    return extractFromTranscript(transcript, clinicianNotes);
  }
  return extractFromTranscript(transcript, clinicianNotes);
}

module.exports = { generateDraft, extractFromTranscript };

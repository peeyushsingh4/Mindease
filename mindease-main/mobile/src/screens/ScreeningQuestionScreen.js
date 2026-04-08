import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import api, { extractErrorMessage } from '../api/client';
import { colors, commonStyles } from '../styles/common';

const OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
];

const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure',
  'Trouble concentrating on things, such as reading or watching television',
  'Moving or speaking so slowly that other people could have noticed',
  'Thoughts that you would be better off dead, or of hurting yourself',
];

const GAD7_QUESTIONS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid, as if something awful might happen',
];

const getSeverity = (type, score) => {
  if (type === 'PHQ-9') {
    if (score <= 4) return 'Minimal';
    if (score <= 9) return 'Mild';
    if (score <= 14) return 'Moderate';
    if (score <= 19) return 'Moderately Severe';
    return 'Severe';
  }
  if (score <= 4) return 'Minimal';
  if (score <= 9) return 'Mild';
  if (score <= 14) return 'Moderate';
  return 'Severe';
};

const ScreeningQuestionScreen = ({ navigation, route }) => {
  const type = route?.params?.type || 'PHQ-9';
  const questions = useMemo(() => (type === 'PHQ-9' ? PHQ9_QUESTIONS : GAD7_QUESTIONS), [type]);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const allAnswered = answers.every((value) => value !== null);

  const updateAnswer = (questionIndex, value) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = value;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!allAnswered) {
      setError('Please answer every question before submitting.');
      return;
    }
    setError('');
    setSubmitting(true);

    const score = answers.reduce((sum, value) => sum + Number(value), 0);
    const severity = getSeverity(type, score);

    try {
      await api.post('/screening', { type, answers });
      setResult({ score, severity });
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not submit assessment.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <SafeAreaView style={commonStyles.screen}>
        <ScrollView contentContainerStyle={commonStyles.contentContainer}>
          <View style={[commonStyles.card, { gap: 12 }]}>
            <Text style={commonStyles.title}>{type} result</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 34, fontWeight: '800' }}>{result.score}</Text>
            <Text style={{ color: colors.primaryDark, fontSize: 18, fontWeight: '700' }}>{result.severity}</Text>
            <Text style={commonStyles.subtitle}>
              Your score was saved and can be reviewed from the screenings tab.
            </Text>

            <TouchableOpacity style={commonStyles.button} onPress={() => navigation.navigate('Appointments')}>
              <Text style={commonStyles.buttonText}>Book Appointment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[commonStyles.button, commonStyles.buttonSecondary]} onPress={() => navigation.navigate('ScreeningHub')}>
              <Text style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}>Back to Screenings</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.screen}>
      <ScrollView contentContainerStyle={commonStyles.contentContainer}>
        <View style={[commonStyles.card, { gap: 10 }]}>
          <Text style={commonStyles.title}>{type} assessment</Text>
          <Text style={commonStyles.subtitle}>Over the last 2 weeks, how often have you been bothered by these problems?</Text>
        </View>

        {questions.map((question, idx) => (
          <View key={`${type}-${idx}`} style={[commonStyles.card, { gap: 8 }]}>
            <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
              {idx + 1}. {question}
            </Text>
            <View style={{ gap: 8 }}>
              {OPTIONS.map((option) => {
                const selected = answers[idx] === option.value;
                return (
                  <TouchableOpacity
                    key={`${idx}-${option.value}`}
                    onPress={() => updateAnswer(idx, option.value)}
                    style={{
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : '#DDE8EE',
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 9,
                      backgroundColor: selected ? '#EBF4F8' : '#FFFFFF',
                    }}
                  >
                    <Text style={{ color: colors.textPrimary, fontWeight: selected ? '700' : '500' }}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[commonStyles.button, { opacity: allAnswered ? 1 : 0.5 }]}
          onPress={handleSubmit}
          disabled={!allAnswered || submitting}
        >
          <Text style={commonStyles.buttonText}>{submitting ? 'Submitting…' : 'Submit Assessment'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScreeningQuestionScreen;

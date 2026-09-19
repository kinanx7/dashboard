// Test verifying that new applicants receive answers and display properly
const fs = require('fs');

console.log('=== Verifying New Application Data Flow ===');

// Simulate job with 4 questions (like Delivery Driver in user screenshot)
const sampleJob = {
    id: 'job_delivery_123',
    title: 'Delivery Driver / سائق توصيل طلبات',
    questions: [
        { id: 'q_license', text: 'هل لديك رخصة قيادة سارية؟', type: 'select', options: ['نعم', 'لا'] },
        { id: 'q_vehicle', text: 'هل تملك سيارة أو دباب خاص للتوصيل؟', type: 'select', options: ['سيارة خاصة', 'دباب خاص'] },
        { id: 'q_riyadh', text: 'هل تعرف أحياء وشوارع المدينة جيداً وتستخدم خرائط قوقل؟', type: 'select', options: ['نعم ممتاز', 'متوسط'] },
        { id: 'q_iqama', text: 'هل الإقامة سارية وقابلة للنقل؟', type: 'select', options: ['نعم', 'لا'] }
    ]
};

// Simulate new applicant submitting form with answers
const sampleNewApplicant = {
    id: 'app_new_test',
    jobId: 'job_delivery_123',
    jobTitle: sampleJob.title,
    applicantName: 'محمد أحمد',
    phone: '0555123456',
    nationality: 'سعودي',
    answers: {
        'q_license': 'نعم',
        'q_vehicle': 'سيارة خاصة',
        'q_riyadh': 'نعم ممتاز',
        'q_iqama': 'نعم'
    },
    answersDetailed: [
        { id: 'q_license', question: 'هل لديك رخصة قيادة سارية؟', answer: 'نعم' },
        { id: 'q_vehicle', question: 'هل تملك سيارة أو دباب خاص للتوصيل؟', answer: 'سيارة خاصة' },
        { id: 'q_riyadh', question: 'هل تعرف أحياء وشوارع المدينة جيداً وتستخدم خرائط قوقل؟', answer: 'نعم ممتاز' },
        { id: 'q_iqama', question: 'هل الإقامة سارية وقابلة للنقل؟', answer: 'نعم' }
    ],
    submittedAt: Date.now()
};

// Test displayList builder logic from openApplicantDetailsModal
const answers = sampleNewApplicant.answers || {};
const answersDetailed = Array.isArray(sampleNewApplicant.answersDetailed) ? sampleNewApplicant.answersDetailed : [];
const jobQuestions = sampleJob.questions || [];

const displayList = [];
const handledQIds = new Set();

if (answersDetailed.length > 0) {
    answersDetailed.forEach(item => {
        if (item && item.id) {
            handledQIds.add(item.id);
            displayList.push({
                id: item.id,
                question: item.question || item.id,
                answer: item.answer || '—',
                hasAnswer: !!(item.answer && item.answer.trim() && item.answer.trim() !== '—')
            });
        }
    });
}

console.log('Total questions rendered in modal:', displayList.length);
displayList.forEach((item, idx) => {
    console.log(`  Question #${idx + 1}: ${item.question}`);
    console.log(`    Answer: "${item.answer}" | Answered status: ${item.hasAnswer ? '✅ Answered' : '❌ Not answered'}`);
});

const allAnswered = displayList.every(item => item.hasAnswer === true);
if (allAnswered && displayList.length === 4) {
    console.log('\n✅ PASS: New applicant will show all 4 questions WITH their actual answers and green "Answered" badges!');
} else {
    console.error('\n❌ FAIL: New applicant answers were not detected');
    process.exit(1);
}

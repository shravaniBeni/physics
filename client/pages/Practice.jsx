import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, API_CONFIG } from '../config/api';
import { Button } from '../Components/ui/button';
import { Card } from '../Components/ui/card';
import { Badge } from '../Components/ui/badge';
import { Progress } from '../Components/ui/progress';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Trophy,
  RotateCcw,
  Lightbulb,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const quizQuestions = {
  mechanics: {
    easy: [
      {
        question: "What is the SI unit of force?",
        options: ["Joule", "Newton", "Watt", "Pascal"],
        correct: 1,
        explanation: "Force is measured in Newtons (N). 1 Newton = 1 kg × m/s²"
      },
      {
        question: "If an object is at rest, its velocity is:",
        options: ["Infinite", "Negative", "Zero", "Positive"],
        correct: 2,
        explanation: "An object at rest has zero velocity as it's not changing its position."
      },
      {
        question: "Which of Newton's laws explains why we wear seatbelts?",
        options: ["First Law", "Second Law", "Third Law", "Law of Gravitation"],
        correct: 0,
        explanation: "The First Law (Inertia) - objects in motion tend to stay in motion. Seatbelts stop us from continuing forward when the car stops suddenly."
      }
    ],
    medium: [
      {
        question: "A 5 kg object accelerates at 2 m/s². What is the force applied?",
        options: ["2.5 N", "7 N", "10 N", "3 N"],
        correct: 2,
        explanation: "Using F = ma: F = 5 kg × 2 m/s² = 10 N"
      },
      {
        question: "The kinetic energy of an object doubles when its velocity:",
        options: ["Doubles", "Increases by √2 times", "Triples", "Quadruples"],
        correct: 1,
        explanation: "KE = ½mv². For KE to double: 2(½mv²) = ½m(v√2)². So velocity increases by √2 ≈ 1.41 times"
      }
    ],
    hard: [
      {
        question: "A projectile is launched at 45°. At what angle should it be launched to achieve half the maximum range?",
        options: ["15° or 75°", "22.5° or 67.5°", "30° or 60°", "20° or 70°"],
        correct: 0,
        explanation: "Range = (v²sin2θ)/g. For half max range: sin2θ = 0.5, so 2θ = 30° or 150°, giving θ = 15° or 75°"
      }
    ]
  },
  electricity: {
    easy: [
      {
        question: "What is the SI unit of electric current?",
        options: ["Volt", "Ohm", "Ampere", "Coulomb"],
        correct: 2,
        explanation: "Electric current is measured in Amperes (A). 1 Ampere = 1 Coulomb per second"
      },
      {
        question: "In Ohm's law V = IR, if resistance doubles (voltage constant), current:",
        options: ["Doubles", "Halves", "Stays same", "Quadruples"],
        correct: 1,
        explanation: "I = V/R. If R doubles and V is constant, I becomes half."
      }
    ],
    medium: [
      {
        question: "A 12V battery drives a current of 2A through a circuit. What is the resistance?",
        options: ["24 Ω", "6 Ω", "14 Ω", "10 Ω"],
        correct: 1,
        explanation: "Using R = V/I: R = 12V / 2A = 6 Ω"
      }
    ],
    hard: [
      {
        question: "Three resistors of 6Ω each are connected in parallel. The equivalent resistance is:",
        options: ["18 Ω", "6 Ω", "2 Ω", "9 Ω"],
        correct: 2,
        explanation: "1/R = 1/6 + 1/6 + 1/6 = 3/6 = 1/2. So R = 2 Ω"
      }
    ]
  },
  waves: {
    easy: [
      {
        question: "The number of complete oscillations per second is called:",
        options: ["Wavelength", "Amplitude", "Frequency", "Period"],
        correct: 2,
        explanation: "Frequency (f) is the number of complete cycles per second, measured in Hertz (Hz)"
      }
    ],
    medium: [
      {
        question: "A wave has frequency 50 Hz and wavelength 2m. What is its speed?",
        options: ["25 m/s", "52 m/s", "100 m/s", "48 m/s"],
        correct: 2,
        explanation: "Using v = fλ: v = 50 Hz × 2 m = 100 m/s"
      }
    ],
    hard: [
      {
        question: "Two waves with frequencies 256 Hz and 260 Hz produce beats. The beat frequency is:",
        options: ["516 Hz", "4 Hz", "258 Hz", "2 Hz"],
        correct: 1,
        explanation: "Beat frequency = |f₁ - f₂| = |256 - 260| = 4 Hz"
      }
    ]
  },
  optics: {
    easy: [
      {
        question: "A convex lens is also known as:",
        options: ["Diverging lens", "Converging lens", "Plane lens", "Concave lens"],
        correct: 1,
        explanation: "Convex lenses converge parallel light rays to a focal point."
      }
    ],
    medium: [
      {
        question: "An object placed at 2F from a convex lens forms an image that is:",
        options: ["Virtual and magnified", "Real and same size", "Real and diminished", "Virtual and same size"],
        correct: 1,
        explanation: "At 2F, the image forms at 2F on the other side, same size, real, and inverted."
      }
    ],
    hard: [
      {
        question: "The power of a lens with focal length 25 cm is:",
        options: ["4 D", "-4 D", "0.25 D", "25 D"],
        correct: 0,
        explanation: "Power P = 1/f (in meters) = 1/0.25 = 4 Diopters"
      }
    ]
  },
  thermodynamics: {
    easy: [
      {
        question: "Heat always flows from:",
        options: ["Cold to hot body", "Hot to cold body", "Both directions equally", "Depends on material"],
        correct: 1,
        explanation: "Heat naturally flows from higher to lower temperature regions."
      }
    ],
    medium: [
      {
        question: "How much heat is needed to raise 2 kg of water by 5°C? (c = 4200 J/kg°C)",
        options: ["21000 J", "42000 J", "4200 J", "10500 J"],
        correct: 1,
        explanation: "Q = mcΔT = 2 × 4200 × 5 = 42000 J = 42 kJ"
      }
    ],
    hard: [
      {
        question: "In an adiabatic process:",
        options: ["Temperature is constant", "No heat transfer occurs", "Pressure is constant", "Volume is constant"],
        correct: 1,
        explanation: "Adiabatic means Q = 0 (no heat exchange with surroundings)."
      }
    ]
  }
};

const categories = ['mechanics', 'electricity', 'waves', 'optics', 'thermodynamics'];
const difficulties = ['easy', 'medium', 'hard'];

export default function Practice() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const queryClient = useQueryClient();

  const questions = selectedCategory && selectedDifficulty 
    ? quizQuestions[selectedCategory]?.[selectedDifficulty] || []
    : [];

  const saveQuizMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      // Create a practice quiz attempt
      const quizData = {
        experiment_id: null, // Practice quiz, not tied to specific experiment
        total_questions: questions.length,
        correct_answers: score,
        time_taken_seconds: 0,
        questions_data: answers,
        is_ai_generated: false,
        category: selectedCategory,
        difficulty: selectedDifficulty
      };

      // Since we don't have a practice quiz endpoint, we'll use the regular quiz submit
      // but with a special flag or create a separate endpoint
      const response = await apiRequest(API_CONFIG.ENDPOINTS.QUIZ.SUBMIT, {
        method: 'POST',
        body: JSON.stringify(quizData)
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['quiz-attempts']);
      queryClient.invalidateQueries(['point-transactions']);
    },
    onError: (error) => {
      console.error('Failed to save practice quiz:', error);
      // Continue anyway, don't block the user
    }
  });

  const handleAnswer = (optionIndex) => {
    if (showResult) return;
    setSelectedAnswer(optionIndex);
    setShowResult(true);
    
    const isCorrect = optionIndex === questions[currentQuestion].correct;
    if (isCorrect) setScore(prev => prev + 1);
    
    setAnswers(prev => [...prev, {
      question: questions[currentQuestion].question,
      user_answer: questions[currentQuestion].options[optionIndex],
      correct_answer: questions[currentQuestion].options[questions[currentQuestion].correct],
      is_correct: isCorrect
    }]);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
      saveQuizMutation.mutate();
    }
  };

  const resetQuiz = () => {
    setSelectedCategory(null);
    setSelectedDifficulty(null);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
    setQuizComplete(false);
  };

  const startQuiz = () => {
    if (selectedCategory && selectedDifficulty) {
      setCurrentQuestion(0);
      setScore(0);
      setAnswers([]);
      setQuizComplete(false);
    }
  };

  // Selection Screen
  if (!selectedCategory || !selectedDifficulty || questions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Practice & Assessment</h1>
          <p className="text-slate-400">Test your physics knowledge with topic-based quizzes</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Select Topic</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "p-4 rounded-xl border text-center capitalize transition-all",
                  selectedCategory === cat
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                    : "bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600"
                )}
              >
                <span className="text-2xl block mb-2">
                  {cat === 'mechanics' && '⚙️'}
                  {cat === 'electricity' && '⚡'}
                  {cat === 'waves' && '🌊'}
                  {cat === 'optics' && '🔬'}
                  {cat === 'thermodynamics' && '🔥'}
                </span>
                {cat}
              </button>
            ))}
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Select Difficulty</h2>
          <div className="grid grid-cols-3 gap-3">
            {difficulties.map(diff => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={cn(
                  "p-4 rounded-xl border text-center capitalize transition-all",
                  selectedDifficulty === diff
                    ? diff === 'easy' ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                      : diff === 'medium' ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                      : "bg-rose-500/20 border-rose-500/50 text-rose-400"
                    : "bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600"
                )}
              >
                {diff}
              </button>
            ))}
          </div>
        </Card>

        <Button
          onClick={startQuiz}
          disabled={!selectedCategory || !selectedDifficulty || questions.length === 0}
          className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white py-6 text-lg"
        >
          <Play className="w-5 h-5 mr-2" />
          Start Quiz
        </Button>

        {selectedCategory && selectedDifficulty && questions.length === 0 && (
          <p className="text-center text-amber-400">No questions available for this combination. Try another!</p>
        )}
      </div>
    );
  }

  // Quiz Complete Screen
  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
            <p className="text-slate-400 mb-6">You've finished the {selectedCategory} quiz</p>
            
            <div className="text-5xl font-bold mb-4">
              <span className={percentage >= 70 ? "text-emerald-400" : percentage >= 40 ? "text-amber-400" : "text-rose-400"}>
                {score}
              </span>
              <span className="text-slate-500">/{questions.length}</span>
            </div>
            
            <div className="w-full bg-slate-700 rounded-full h-3 mb-6">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={cn(
                  "h-3 rounded-full",
                  percentage >= 70 ? "bg-emerald-500" : percentage >= 40 ? "bg-amber-500" : "bg-rose-500"
                )}
              />
            </div>

            <p className="text-lg mb-6">
              {percentage >= 70 ? "🎉 Excellent work! You've mastered this topic!" :
               percentage >= 40 ? "👍 Good effort! Keep practicing to improve!" :
               "📚 Keep studying! Review the concepts and try again."}
            </p>

            <div className="flex gap-3 justify-center">
              <Button onClick={resetQuiz} variant="outline" className="border-slate-600 text-slate-300">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => {
                resetQuiz();
              }} className="bg-cyan-600 hover:bg-cyan-700">
                New Topic
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Review Answers */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Review Answers</h3>
          <div className="space-y-3">
            {answers.map((ans, i) => (
              <div key={i} className={cn(
                "p-4 rounded-lg border",
                ans.is_correct ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"
              )}>
                <div className="flex items-start gap-3">
                  {ans.is_correct ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-white mb-1">{ans.question}</p>
                    <p className="text-sm">
                      <span className="text-slate-400">Your answer: </span>
                      <span className={ans.is_correct ? "text-emerald-400" : "text-rose-400"}>{ans.user_answer}</span>
                    </p>
                    {!ans.is_correct && (
                      <p className="text-sm">
                        <span className="text-slate-400">Correct answer: </span>
                        <span className="text-emerald-400">{ans.correct_answer}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Quiz Question Screen
  const question = questions[currentQuestion];
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className="bg-slate-700 text-slate-300 capitalize">{selectedCategory}</Badge>
          <Badge className={cn(
            selectedDifficulty === 'easy' ? "bg-emerald-500/20 text-emerald-400" :
            selectedDifficulty === 'medium' ? "bg-amber-500/20 text-amber-400" :
            "bg-rose-500/20 text-rose-400"
          )}>
            {selectedDifficulty}
          </Badge>
        </div>
        <span className="text-slate-400 text-sm">
          Question {currentQuestion + 1} of {questions.length}
        </span>
      </div>

      <Progress value={(currentQuestion / questions.length) * 100} className="h-2 bg-slate-700" />

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Target className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">{question.question}</h2>
            </div>

            <div className="space-y-3">
              {question.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={showResult}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    showResult
                      ? i === question.correct
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : i === selectedAnswer
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                        : "bg-slate-800/50 border-slate-700 text-slate-400"
                      : selectedAnswer === i
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                      : "bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-sm font-medium">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{option}</span>
                    {showResult && i === question.correct && (
                      <CheckCircle2 className="w-5 h-5 ml-auto text-emerald-400" />
                    )}
                    {showResult && i === selectedAnswer && i !== question.correct && (
                      <XCircle className="w-5 h-5 ml-auto text-rose-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Explanation */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30"
              >
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-400 mb-1">Explanation</p>
                    <p className="text-sm text-slate-300">{question.explanation}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Next Button */}
      {showResult && (
        <Button
          onClick={nextQuestion}
          className="w-full bg-cyan-600 hover:bg-cyan-700"
        >
          {currentQuestion < questions.length - 1 ? (
            <>Next Question <ArrowRight className="w-4 h-4 ml-2" /></>
          ) : (
            <>View Results <Trophy className="w-4 h-4 ml-2" /></>
          )}
        </Button>
      )}

      {/* Score */}
      <div className="text-center text-slate-400">
        Current Score: <span className="text-cyan-400 font-bold">{score}</span> / {currentQuestion + (showResult ? 1 : 0)}
      </div>
    </div>
  );
}
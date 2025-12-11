import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ModernNavbar } from "@/components/common/ModernNavbar";
import { ModernFooter } from "@/components/common/ModernFooter";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import ChatWidget from "@/components/common/ChatWidget";

const faqs = [
  {
    question: "What age groups do you cater to?",
    answer: "We provide tutoring for students from Year 1 to Year 12, covering all levels from basic mathematics to Extension 2 Mathematics, English literacy, and Science subjects."
  },
  {
    question: "How are your tutoring programs personalized?",
    answer: "Every student receives a customized learning plan based on their individual needs, learning style, and academic goals. We conduct initial assessments and regularly review progress to adapt our approach."
  },
  {
    question: "What makes MBEST different from other tutoring centers?",
    answer: "Our approach combines research-backed teaching methods from leading educators like John Hattie and Carol Dweck with behavioral therapy techniques. We focus on both academic excellence and building confidence."
  },
  {
    question: "Do you offer online tutoring sessions?",
    answer: "Yes, we offer both in-person and online tutoring sessions to accommodate different preferences and circumstances. Our online platform includes interactive tools and progress tracking."
  },
  {
    question: "How do you prepare students for selective school tests?",
    answer: "Our selective school preparation program includes practice tests, time management strategies, test-taking techniques, and comprehensive coverage of all subject areas typically assessed."
  },
  {
    question: "What is your success rate?",
    answer: "We maintain a 95% improvement rate in academic performance, with many students achieving their target school placements and significant grade improvements."
  },
  {
    question: "How often should my child attend tutoring sessions?",
    answer: "We recommend 1-2 sessions per week depending on the student's needs, goals, and current academic level. We'll discuss the optimal frequency during your consultation."
  },
  {
    question: "Do you provide homework support?",
    answer: "Yes, our tutors help students with their school homework while also providing additional practice materials and exercises to reinforce learning."
  },
  {
    question: "How do you track student progress?",
    answer: "We use regular assessments, progress reports, and our online platform to monitor student development. Parents receive detailed updates on their child's advancement."
  },
  {
    question: "What if my child needs help with exam anxiety?",
    answer: "Our approach includes psychological support techniques to help students manage exam stress and build confidence. We integrate mindfulness and stress management strategies into our tutoring."
  },
  {
    question: "Can you help with university entrance preparation?",
    answer: "Absolutely! We provide comprehensive HSC preparation, including trial exams, study strategies, and university application guidance."
  },
  {
    question: "What are your fees and payment options?",
    answer: "Our fees vary based on the program and frequency of sessions. We offer flexible payment options and package deals. Contact us for detailed pricing information tailored to your needs."
  }
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-50 dark:from-background dark:via-background dark:to-background">
      <ModernNavbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
                Frequently Asked
                <br />
                <span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
                  Questions
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Find answers to common questions about our tutoring programs, 
                teaching methods, and how we can help your child succeed.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <div className="max-w-4xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
                    className="bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-lg border shadow-sm"
                  >
                    <AccordionTrigger className="px-6 py-4 text-left font-semibold text-foreground hover:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <ModernFooter />
      <ChatWidget />
    </div>
  );
}
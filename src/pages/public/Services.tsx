import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Calculator, 
  BookOpen, 
  Users, 
  Trophy,
  Target,
  Play,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { ModernNavbar } from "@/components/common/ModernNavbar";
import { ModernFooter } from "@/components/common/ModernFooter";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { StaggeredReveal } from "@/components/animations/StaggeredReveal";
import { motion } from "framer-motion";

export default function Services() {
  const tutoringPrograms = [
    {
      subject: "Mathematics",
      levels: "Years 1-12",
      description: "Comprehensive mathematics tutoring covering all levels including Standard, Advanced, Extension 1 & 2.",
      features: ["Problem-solving techniques", "Exam strategies", "Concept mastery", "Confidence building"],
      icon: <Calculator className="h-8 w-8 text-primary" />
    },
    {
      subject: "English",
      levels: "Years 1-6",
      description: "Literacy, comprehension, and vocabulary development with personalized learning approaches.",
      features: ["Reading comprehension", "Writing skills", "Vocabulary expansion", "Critical thinking"],
      icon: <BookOpen className="h-8 w-8 text-primary" />
    },
    {
      subject: "Science",
      levels: "Years 7-10",
      description: "Foundation science concepts across Physics, Chemistry, and Biology with hands-on learning.",
      features: ["Conceptual understanding", "Practical applications", "Scientific method", "Lab skills"],
      icon: <Target className="h-8 w-8 text-primary" />
    }
  ];

  const examPrep = [
    {
      title: "OC Test Coaching",
      description: "Comprehensive preparation for Opportunity Class testing with proven strategies.",
      duration: "6-month intensive program",
      features: ["Practice tests", "Time management", "Critical thinking", "Mock assessments"]
    },
    {
      title: "Selective School Preparation",
      description: "Specialized coaching for selective school entrance examinations.",
      duration: "8-month comprehensive program", 
      features: ["Subject mastery", "Test techniques", "Interview skills", "Application support"]
    },
    {
      title: "HSC Trial & Final Exam Prep",
      description: "Intensive preparation for HSC examinations with expert guidance.",
      duration: "Term-based programs",
      features: ["Past paper analysis", "Exam strategies", "Stress management", "Revision techniques"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernNavbar />

      {/* Hero Section */}
      <section className="py-32 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto text-center">
          <ScrollReveal direction="up">
            <Badge variant="secondary" className="mb-6">
              Comprehensive Educational Services
            </Badge>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.1}>
            <h2 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
              Our
              <br />
              <span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
                Services
              </span>
            </h2>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.2}>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Comprehensive mathematics education tailored to every student's needs, 
              from foundational concepts to advanced examinations.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Tutoring Programs */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-foreground mb-4">Tutoring Programs</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Personalized tutoring programs designed to build strong foundations and achieve academic excellence.
              </p>
            </div>
          </ScrollReveal>
          
          <StaggeredReveal staggerDelay={0.15}>
            {tutoringPrograms.map((program, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-lg bg-card hover:shadow-2xl transition-all h-full group">
                  <CardContent className="p-8">
                    <motion.div 
                      className="mb-6 flex justify-center"
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.6 }}
                    >
                      {program.icon}
                    </motion.div>
                    <h4 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{program.subject}</h4>
                    <Badge variant="outline" className="mb-4">{program.levels}</Badge>
                    <p className="text-muted-foreground mb-6 leading-relaxed">{program.description}</p>
                    <div className="space-y-2">
                      {program.features.map((feature, idx) => (
                        <motion.div 
                          key={idx} 
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </StaggeredReveal>
        </div>
      </section>

      {/* Exam Preparation */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-foreground mb-4">Exam Preparation</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Specialized preparation programs for major educational milestones and competitive examinations.
              </p>
            </div>
          </ScrollReveal>
          
          <StaggeredReveal staggerDelay={0.15}>
            {examPrep.map((exam, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-lg bg-card hover:shadow-2xl transition-all h-full group">
                  <CardContent className="p-8">
                    <motion.div 
                      className="mb-6 flex justify-center"
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Trophy className="h-8 w-8 text-warning" />
                    </motion.div>
                    <h4 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{exam.title}</h4>
                    <Badge variant="secondary" className="mb-4">{exam.duration}</Badge>
                    <p className="text-muted-foreground mb-6 leading-relaxed">{exam.description}</p>
                    <div className="space-y-2">
                      {exam.features.map((feature, idx) => (
                        <motion.div 
                          key={idx} 
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </StaggeredReveal>
        </div>
      </section>

      {/* Class Types */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="left">
              <div>
                <h3 className="text-3xl font-bold text-foreground mb-6">
                  Flexible Learning Options
                </h3>
                <div className="space-y-6">
                  {[
                    { icon: Users, color: "primary", title: "One-on-One Tutoring", desc: "Personalized attention with customized learning plans tailored to individual needs and learning pace." },
                    { icon: Users, color: "success", title: "Small Group Sessions", desc: "Collaborative learning environment with 2-4 students, encouraging peer interaction and shared problem-solving." },
                    { icon: Play, color: "warning", title: "Online Sessions", desc: "Flexible online tutoring with interactive whiteboards and digital resources for remote learning." }
                  ].map((item, index) => (
                    <motion.div 
                      key={index}
                      className="flex items-start gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 10 }}
                    >
                      <div className={`w-12 h-12 bg-${item.color}/20 rounded-full flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`h-6 w-6 text-${item.color}`} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">{item.title}</h4>
                        <p className="text-muted-foreground">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
            
            <ScrollReveal direction="right">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-success/20 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                  <GraduationCap className="h-32 w-32 text-primary" />
                </div>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-primary">
        <div className="container mx-auto text-center">
          <ScrollReveal direction="up">
            <h3 className="text-3xl font-bold text-white mb-6">
              Ready to Get Started?
            </h3>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              Choose the program that best fits your needs and take the first step 
              towards academic excellence with MBEST.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/appointments">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" variant="secondary">
                    Book Free Consultation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link to="/contact">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary transition-all">
                    Contact Us
                  </Button>
                </motion.div>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
}
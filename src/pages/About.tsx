import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Eye, Users, Award } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Mission",
      description: "To empower businesses with cutting-edge web solutions that drive growth and innovation.",
    },
    {
      icon: Eye,
      title: "Vision",
      description: "To be the leading web development agency known for exceptional quality and client satisfaction.",
    },
    {
      icon: Users,
      title: "Team",
      description: "A passionate group of developers, designers, and strategists dedicated to your success.",
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We strive for perfection in every project, delivering solutions that exceed expectations.",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold mb-4 text-gradient">About Bamboo Coders</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're a team of passionate developers and designers creating exceptional web experiences
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-20"
          >
            <Card className="glass p-8">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p>
                  Founded with a vision to transform the digital landscape, Bamboo Coders has grown into a trusted partner
                  for businesses seeking exceptional web solutions. We specialize in React and Next.js development,
                  combining technical expertise with creative design to deliver products that not only look stunning but
                  perform flawlessly.
                </p>
                <p>
                  Our approach is collaborative and transparent. We believe in building lasting relationships with our
                  clients, understanding their unique challenges, and crafting solutions that drive real results. Every
                  project is an opportunity to innovate, learn, and push the boundaries of what's possible on the web.
                </p>
              </div>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="glass h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{value.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center glass p-12 rounded-2xl"
          >
            <h2 className="text-3xl font-bold mb-4">Let's Work Together</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Ready to start your next project? We'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-muted-foreground">
              <a href="mailto:hello@bamboocoders.com" className="hover:text-primary transition-colors">
                hello@bamboocoders.com
              </a>
              <span className="hidden sm:inline">•</span>
              <a href="tel:+1234567890" className="hover:text-primary transition-colors">
                +1 (234) 567-890
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
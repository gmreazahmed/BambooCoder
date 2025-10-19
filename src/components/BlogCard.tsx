import { Link } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";

interface BlogCardProps {
  id: string;
  title: string;
  excerpt?: string;
  thumbnail_url?: string;
  created_at: string;
  slug: string;
}

const BlogCard = ({ id, title, excerpt, thumbnail_url, created_at, slug }: BlogCardProps) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <Link to={`/blog/${slug}`}>
        <Card className="h-full overflow-hidden glass hover:glow-primary transition-all duration-300 group">
          {thumbnail_url && (
            <div className="aspect-video overflow-hidden">
              <img
                src={thumbnail_url}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          )}
          <CardHeader>
            <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>
          </CardHeader>
          <CardContent>
            {excerpt && (
              <p className="text-muted-foreground line-clamp-3">{excerpt}</p>
            )}
          </CardContent>
          <CardFooter className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>5 min read</span>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
};

export default BlogCard;
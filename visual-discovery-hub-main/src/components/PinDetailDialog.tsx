import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";
import { Heart, Share2, Download, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface PinDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: string;
  title: string;
  author: string;
}

const PinDetailDialog = ({ open, onOpenChange, image, title, author }: PinDetailDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative bg-muted">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Details Section */}
          <div className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <Button size="sm" className="rounded-full">
                  Save
                </Button>
                <Button size="sm" variant="secondary" className="rounded-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
              <Button size="icon" variant="ghost" className="rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{title}</h2>
              <p className="text-muted-foreground mb-6">
                A beautiful collection showcasing creative inspiration and design excellence
              </p>

              <div className="flex items-center gap-3 mb-6">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {author.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{author}</p>
                  <p className="text-sm text-muted-foreground">1.2k followers</p>
                </div>
                <Button size="sm" variant="outline" className="ml-auto rounded-full">
                  Follow
                </Button>
              </div>

              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <Heart className="h-5 w-5" />
                  </Button>
                  <span className="text-sm text-muted-foreground">234 likes</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <Download className="h-5 w-5" />
                  </Button>
                  <span className="text-sm text-muted-foreground">Download</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-2">Comments</h3>
              <p className="text-sm text-muted-foreground">
                No comments yet. Be the first to comment!
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PinDetailDialog;

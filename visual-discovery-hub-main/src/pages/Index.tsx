import Header from "@/components/Header";
import MasonryGrid from "@/components/MasonryGrid";
import PinCard from "@/components/PinCard";
import pin1 from "@/assets/pin1.jpg";
import pin2 from "@/assets/pin2.jpg";
import pin3 from "@/assets/pin3.jpg";
import pin4 from "@/assets/pin4.jpg";
import pin5 from "@/assets/pin5.jpg";
import pin6 from "@/assets/pin6.jpg";
import pin7 from "@/assets/pin7.jpg";
import pin8 from "@/assets/pin8.jpg";

const pins = [
  { id: 1, image: pin1, title: "Modern Interior Design", author: "Sarah Design" },
  { id: 2, image: pin2, title: "Mountain Sunset Views", author: "Nature Explorer" },
  { id: 3, image: pin3, title: "Gourmet Food Art", author: "Chef Thomas" },
  { id: 4, image: pin4, title: "Urban Fashion Style", author: "Style Maven" },
  { id: 5, image: pin5, title: "Abstract Art Collection", author: "Art Gallery" },
  { id: 6, image: pin6, title: "Coffee Shop Vibes", author: "Cafe Culture" },
  { id: 7, image: pin7, title: "Modern Architecture", author: "Design Studio" },
  { id: 8, image: pin8, title: "Beach Paradise", author: "Travel Dreams" },
  // Duplicate for demo
  { id: 9, image: pin1, title: "Minimal Living Space", author: "Sarah Design" },
  { id: 10, image: pin3, title: "Culinary Excellence", author: "Chef Thomas" },
  { id: 11, image: pin2, title: "Nature's Beauty", author: "Nature Explorer" },
  { id: 12, image: pin5, title: "Contemporary Art", author: "Art Gallery" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MasonryGrid>
        {pins.map((pin) => (
          <PinCard
            key={pin.id}
            image={pin.image}
            title={pin.title}
            author={pin.author}
          />
        ))}
      </MasonryGrid>
    </div>
  );
};

export default Index;

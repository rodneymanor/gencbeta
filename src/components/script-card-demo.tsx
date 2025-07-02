import ScriptCard from "./script-card"

export default function ScriptCardDemo() {
  const sampleScript = `🎬 MORNING ROUTINE THAT CHANGED MY LIFE

*Camera opens on messy bedroom*

"Okay, so 6 months ago I was a complete disaster..."

*Quick montage of old messy habits*

"But then I discovered this ONE thing that changed everything."

*Dramatic pause*

"I started making my bed. That's it."

*Show perfectly made bed*

"It sounds simple, but here's why it works..."

*Cut to talking head explaining the psychology*

"When you accomplish something first thing in the morning, it sets the tone for your entire day."

*Show more organized life*

"Try it for 7 days and watch your life transform. Who's in?"`

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <ScriptCard
        profile={{
          name: "Sarah Chen",
          username: "sarahcreates",
          avatar: "/placeholder.svg?height=40&width=40",
        }}
        script={sampleScript}
        engagement={{
          likes: 2847,
          comments: 156,
          shares: 89,
        }}
      />
    </div>
  )
}

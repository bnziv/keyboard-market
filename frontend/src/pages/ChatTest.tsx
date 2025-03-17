import { useState } from 'react';
import { Chat } from '../components/Chat';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

export function ChatTest() {
  const [userId, setUserId] = useState('');
  const [otherUserId, setOtherUserId] = useState('');
  const [otherUserName, setOtherUserName] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  const startChat = () => {
    if (userId && otherUserId && otherUserName) {
      setIsChatting(true);
    }
  };

  if (isChatting) {
    return (
      <div className="container mx-auto p-4">
        <Button 
          onClick={() => setIsChatting(false)}
          className="mb-4"
          variant="outline"
        >
          Back to Setup
        </Button>
        <Chat
          currentUserId={userId}
          otherUserId={otherUserId}
          otherUserName={otherUserName}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center mb-6">Chat Test</h1>
        
        <div className="space-y-2">
          <Label htmlFor="userId">Your User ID</Label>
          <Input
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter your user ID"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="otherUserId">Other User ID</Label>
          <Input
            id="otherUserId"
            value={otherUserId}
            onChange={(e) => setOtherUserId(e.target.value)}
            placeholder="Enter other user's ID"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="otherUserName">Other User Name</Label>
          <Input
            id="otherUserName"
            value={otherUserName}
            onChange={(e) => setOtherUserName(e.target.value)}
            placeholder="Enter other user's name"
          />
        </div>

        <Button 
          onClick={startChat}
          className="w-full"
          disabled={!userId || !otherUserId || !otherUserName}
        >
          Start Chat
        </Button>
      </Card>
    </div>
  );
}

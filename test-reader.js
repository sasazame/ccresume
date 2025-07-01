import { getAllConversations } from './dist/utils/conversationReader.js';

async function test() {
  console.log('Testing conversation reader...');
  try {
    const conversations = await getAllConversations();
    console.log(`Found ${conversations.length} conversations:`);
    
    conversations.forEach((conv, i) => {
      console.log(`\n${i + 1}. Session: ${conv.sessionId}`);
      console.log(`   Project: ${conv.projectName}`);
      console.log(`   Started: ${conv.startTime}`);
      console.log(`   First message: ${conv.firstMessage.substring(0, 50)}...`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
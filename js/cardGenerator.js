import { getValentineDescription, generateValentineImage } from './api.js';
import { saveCard } from './db.js';
import { handleHover, resetHover } from './components/card.js';
import { showToast } from './utils.js';
let room = new WebsimSocket();

export async function generateCard() {
  // Remove existing card and submenu
  const existingCard = document.querySelector('.card');
  const existingSubmenu = document.querySelector('.submenu');
  if (existingCard) {
    existingCard.remove();
  }
  if (existingSubmenu) {
    existingSubmenu.remove();
  }

  // Create new card with front and back
  const cardContainer = document.getElementById('cardContainer');
  const card = document.createElement('div');
  card.className = 'card';
  
  // Create card inner structure with initial flipped state
  const cardInner = document.createElement('div');
  cardInner.className = 'card-inner flipped';
  
  cardInner.innerHTML = `
    <div class="card-front">
      <h2 class="valentine-title"></h2>
      <div class="card-image-container"></div>
      <div class="valentine-message"></div>
      <div class="valentine-type"></div>
    </div>
    <div class="card-back">
      <div class="card-back-design">
        <svg class="card-back-logo" viewBox="0 0 100 100">
          <path d="M50,20 A20,20 0 0,1 70,40 L50,60 L30,40 A20,20 0 0,1 50,20z" fill="currentColor"/>
        </svg>
        <div class="card-back-pattern"></div>
      </div>
    </div>
  `;
  
  card.appendChild(cardInner);
  
  // Create submenu but start hidden
  const submenu = document.createElement('div');
  submenu.className = 'submenu hidden';
  
  submenu.innerHTML = `
    <div class="submenu-grid">
      <div class="stat-box">
        <div class="stat-label">Title</div>
        <div class="stat-value">???</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Type</div>
        <div class="stat-value">???</div>
      </div>
      <div class="recipient-input">
        <label for="recipient">Send to:</label>
        <input type="text" id="recipient" placeholder="Enter recipient's username">
        <button class="send-valentine">Send Valentine</button>
      </div>
    </div>
    <div class="description-box">
      <div class="description-title">Message</div>
      <div class="full-description">Generate a Valentine to see its message!</div>
    </div>
  `;
  
  cardContainer.appendChild(submenu);

  // Get Valentine description from LLM
  const valentineData = await getValentineDescription();

  // Update submenu content
  const statValues = submenu.querySelectorAll('.stat-value');
  statValues[0].textContent = valentineData.title;
  statValues[1].textContent = valentineData.type;
  submenu.querySelector('.full-description').textContent = valentineData.message;

  // Generate image based on description and style
  const imageUrl = await generateValentineImage(
    `Valentine's Day card: ${valentineData.style} with ${valentineData.color_scheme} color scheme`
  );
  
  const cardData = {
    title: valentineData.title,
    message: valentineData.message,
    type: valentineData.type,
    style: valentineData.style,
    colorScheme: valentineData.color_scheme,
    imageUrl: imageUrl,
    sender: room.party.client.username,
    timestamp: new Date().getTime()
  };

  if (imageUrl) {
    const valentineImage = document.createElement('img');
    valentineImage.id = `valentine-${Date.now()}`; 
    valentineImage.className = 'valentine-image hidden';
    valentineImage.src = imageUrl;
    valentineImage.alt = `Valentine's Day card: ${valentineData.style}`;
    
    valentineImage.addEventListener('load', async function() {
      const actualSrc = this.currentSrc || this.src;
      if (!actualSrc.includes('Valentine')) {
        this.classList.remove('hidden');
        
        try {
          const response = await fetch(actualSrc);
          const blob = await response.blob();
          const file = new File([blob], `valentine-${Date.now()}.png`, { type: 'image/png' });
          
          const backupImageUrl = await websim.upload(file);
          cardData.imageUrl = actualSrc;
          cardData.backupImageUrl = backupImageUrl;
          
          await saveCard(cardData);
        } catch (error) {
          console.error('Error creating backup image:', error);
          cardData.imageUrl = actualSrc;
          await saveCard(cardData);
        }
      }
    });
    
    const imageContainer = card.querySelector('.card-image-container');
    imageContainer.appendChild(valentineImage);
  }
  
  // Update card content
  card.querySelector('.valentine-title').textContent = valentineData.title;
  card.querySelector('.valentine-message').textContent = valentineData.message;
  card.querySelector('.valentine-type').textContent = valentineData.type;
  
  // Apply color scheme
  const colors = valentineData.color_scheme.split('/');
  card.querySelector('.card-front').style.background = 
    `linear-gradient(135deg, ${colors[0]}26, ${colors[1]}26 70%)`;
  
  cardContainer.appendChild(card);

  // Add click handler with submenu toggle
  card.addEventListener('click', (e) => {
    const cardInner = e.currentTarget.querySelector('.card-inner');
    cardInner.classList.toggle('flipped');
    
    if (!cardInner.classList.contains('flipped')) {
      setTimeout(() => {
        submenu.classList.remove('hidden');
      }, 400);
    } else {
      submenu.classList.add('hidden');
    }
  });

  // Add hover effect
  card.addEventListener('mousemove', handleHover);
  card.addEventListener('mouseleave', resetHover);

  // Setup send functionality
  const sendButton = submenu.querySelector('.send-valentine');
  const recipientInput = submenu.querySelector('#recipient');
  
  sendButton.addEventListener('click', async () => {
    const recipient = recipientInput.value.trim();
    if (!recipient) {
      showToast('Please enter a recipient username', true);
      return;
    }
    
    try {
      const valentine = await room.collection('valentines').create({
        ...cardData,
        recipient,
        sender: room.party.client.username,
        sent_at: new Date().toISOString()
      });
      
      showToast(`Valentine sent to ${recipient}!`);
      recipientInput.value = '';
    } catch (error) {
      console.error('Error sending valentine:', error);
      showToast('Failed to send valentine', true);
    }
  });

  // Show card with initial animation
  requestAnimationFrame(() => {
    card.classList.add('show');
  });
}
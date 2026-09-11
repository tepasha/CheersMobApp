import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Beer, 
  MapPin, 
  Check, 
  Sparkles, 
  Clock, 
  X,
  Smile
} from 'lucide-react';
import { ChatThread, Message } from '../../types';
import { sounds } from '../../services/soundService';
import { ToastModal } from './ToastModal';

interface ChatRoomViewProps {
  chat: ChatThread;
  onBack: () => void;
  onSendMessage: (chatId: string, messageText: string, type?: 'text' | 'cheers' | 'location_proposal', proposal?: Message['proposalData']) => void;
}

export const ChatRoomView: React.FC<ChatRoomViewProps> = ({
  chat,
  onBack,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [showToastsModal, setShowToastsModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [proposalBar, setProposalBar] = useState(chat.buddy.favoriteBars[0] || 'Squat 17b');
  const [proposalTime, setProposalTime] = useState('Сьогодні о 20:30');
  const [isTyping, setIsTyping] = useState(false);
  const [floatingGlasses, setFloatingGlasses] = useState<{ id: number; x: number; y: number }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, isTyping]);

  // Trigger floating beer toast visual animation
  const triggerCheersVisual = () => {
    sounds.playClink();
    const newGlasses = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 200 - 100,
      y: Math.random() * -180 - 50,
    }));
    setFloatingGlasses(newGlasses);
    setTimeout(() => {
      setFloatingGlasses([]);
    }, 1500);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sounds.playMessageSent();
    onSendMessage(chat.id, inputText.trim(), 'text');
    setInputText('');

    // Simulate buddy typing and reply
    triggerBuddyReply('text');
  };

  const handleSendToast = (toastText: string) => {
    triggerCheersVisual();
    onSendMessage(chat.id, toastText, 'cheers');
    setShowToastsModal(false);

    triggerBuddyReply('cheers');
  };

  const handleSendLocationProposal = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playMessageSent();
    onSendMessage(chat.id, `Запропонував зустріч у ${proposalBar}`, 'location_proposal', {
      barName: proposalBar,
      address: `${chat.buddy.locationName}`,
      time: proposalTime,
      status: 'pending',
    });
    setShowLocationModal(false);

    triggerBuddyReply('location');
  };

  const triggerBuddyReply = (context: 'text' | 'cheers' | 'location') => {
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        sounds.playMessageSent();

        let reply = 'Домовились! Буду радий побачитись)';
        if (context === 'cheers') {
          reply = 'Дзинь! 🍻 Будьмо! До дна за хорошу зустріч!';
        } else if (context === 'location') {
          reply = `Чудовий вибір! Обожнюю ${proposalBar}. Забронюю стіл або буду там трохи раніше! 🥂`;
        } else {
          const replies = [
            'Круто! Я якраз закінчую справи і можу підійти.',
            'Супер, беру нам по келиху крафту!',
            'Підтримую, атмосфера там зараз дуже затишна.',
          ];
          reply = replies[Math.floor(Math.random() * replies.length)];
        }

        onSendMessage(chat.id, reply, 'text');
      }, 1600);
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 relative select-none overflow-hidden">
      {/* Top Chat Bar */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="chat-back-btn"
            onClick={onBack}
            className="p-1 rounded-full text-neutral-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative">
            <img
              src={chat.buddy.avatar}
              alt={chat.buddy.name}
              className="w-9 h-9 rounded-full object-cover border border-amber-400/50"
            />
            {chat.buddy.online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-neutral-950" />
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5 leading-none">
              {chat.buddy.name}
              <span className="text-[10px] text-amber-400 font-normal">
                ({chat.buddy.distanceKm} км)
              </span>
            </h3>
            <p className="text-[10px] text-neutral-400">
              {chat.buddy.online ? 'Онлайн • Шукає компанію' : 'Був(ла) нещодавно'}
            </p>
          </div>
        </div>

        {/* Quick toast / clink button in header */}
        <button
          type="button"
          id="header-cheers-btn"
          onClick={() => handleSendToast('Будьмо! 🍻')}
          className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition active:scale-95"
          title="Швидкий тост Дзинь!"
        >
          <Beer className="w-3.5 h-3.5" />
          <span>Дзинь!</span>
        </button>
      </div>

      {/* Floating Animated Toast Emojis */}
      {floatingGlasses.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
          {floatingGlasses.map((glass) => (
            <span
              key={glass.id}
              className="absolute text-4xl animate-clink transition-all duration-700"
              style={{
                transform: `translate(${glass.x}px, ${glass.y}px)`,
                opacity: 0.9,
              }}
            >
              🍻
            </span>
          ))}
        </div>
      )}

      {/* Messages List Area */}
      <div className="flex-1 p-3 overflow-y-auto no-scrollbar space-y-2.5">
        <div className="text-center my-2">
          <span className="text-[10px] bg-neutral-900 text-neutral-400 px-2.5 py-1 rounded-full border border-neutral-800">
            Зʼєднано через Firebase Auth & WebSockets • MongoDB Room #{chat.id}
          </span>
        </div>

        {chat.messages.map((msg) => {
          if (msg.type === 'cheers') {
            return (
              <div
                key={msg.id}
                className={`flex my-2 ${msg.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className="bg-gradient-to-tr from-amber-600/30 to-amber-500/10 border border-amber-500/40 rounded-2xl p-3 max-w-[85%] shadow-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl animate-bounce">🍻</span>
                    <span className="text-xs font-bold text-amber-300">Тост / Будьмо!</span>
                  </div>
                  <p className="text-xs text-white font-medium italic">"{msg.text}"</p>
                  <span className="text-[9px] text-amber-400/80 block text-right mt-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          }

          if (msg.type === 'location_proposal' && msg.proposalData) {
            return (
              <div
                key={msg.id}
                className={`flex my-2 ${msg.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className="bg-neutral-900 border border-amber-500/50 rounded-2xl p-3.5 max-w-[88%] shadow-xl">
                  <div className="flex items-center gap-2 mb-1.5 text-amber-400 font-bold text-xs">
                    <MapPin className="w-4 h-4" />
                    <span>Пропозиція зустрічі в барі</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-0.5">
                    {msg.proposalData.barName}
                  </h4>
                  <p className="text-[11px] text-neutral-400 mb-2">
                    📍 {msg.proposalData.address} • 🕒 {msg.proposalData.time}
                  </p>

                  <div className="flex gap-1.5 pt-1">
                    <button
                      type="button"
                      id={`accept-proposal-btn-${msg.id}`}
                      onClick={() => {
                        sounds.playClink();
                        triggerBuddyReply('cheers');
                      }}
                      className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[11px] font-bold rounded-lg transition"
                    >
                      Прийняти пропозицію
                    </button>
                  </div>
                  <span className="text-[9px] text-neutral-400 block text-right mt-1.5">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-1.5 ${msg.isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!msg.isMe && (
                <img
                  src={chat.buddy.avatar}
                  alt={chat.buddy.name}
                  className="w-6 h-6 rounded-full object-cover mb-0.5"
                />
              )}

              <div
                className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  msg.isMe
                    ? 'bg-amber-500 text-neutral-950 font-medium rounded-br-none shadow-sm'
                    : 'bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-bl-none shadow-sm'
                }`}
              >
                <p>{msg.text}</p>
                <div
                  className={`text-[9px] text-right mt-0.5 flex items-center justify-end gap-1 ${
                    msg.isMe ? 'text-neutral-900/70 font-semibold' : 'text-neutral-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.isMe && <Check className="w-2.5 h-2.5" />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-neutral-400 text-xs pl-8">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[11px] italic">{chat.buddy.name} друкує тост...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Pills (Локація, Тости, тощо) */}
      <div className="px-3 py-1.5 bg-neutral-900/50 border-t border-neutral-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
        <button
          type="button"
          id="quick-toasts-btn"
          onClick={() => setShowToastsModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 text-[11px] font-semibold whitespace-nowrap"
        >
          <Sparkles className="w-3 h-3" />
          <span>Обрати тост 🍻</span>
        </button>

        <button
          type="button"
          id="propose-location-btn"
          onClick={() => setShowLocationModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-[11px] font-medium whitespace-nowrap"
        >
          <MapPin className="w-3 h-3 text-rose-400" />
          <span>Запропонувати бар</span>
        </button>

        <button
          type="button"
          id="send-cheers-action"
          onClick={() => handleSendToast('Будьмо! 🍻')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-[11px] font-medium whitespace-nowrap"
        >
          <Beer className="w-3 h-3 text-amber-400" />
          <span>Келих пива</span>
        </button>
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-2.5 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2 z-20"
      >
        <input
          type="text"
          id="chat-message-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Напишіть повідомлення чи тост..."
          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-neutral-100 placeholder-neutral-500 text-xs focus:outline-none focus:border-amber-400"
        />

        <button
          type="submit"
          id="chat-send-btn"
          disabled={!inputText.trim()}
          className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 flex items-center justify-center transition shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Rich Toasts Picker Modal */}
      <ToastModal
        isOpen={showToastsModal}
        onClose={() => setShowToastsModal(false)}
        onSelectToast={handleSendToast}
        title="Виберіть тост до келиха 🍻"
        allowCustom={true}
      />

      {/* Location Proposal Modal */}
      {showLocationModal && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm z-50 flex flex-col justify-end p-2">
          <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-400" />
                Запропонувати зустріч у закладі
              </h3>
              <button
                type="button"
                id="close-loc-modal-btn"
                onClick={() => setShowLocationModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-200 bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendLocationProposal} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Бар / Локація</label>
                <input
                  type="text"
                  id="proposal-bar-input"
                  value={proposalBar}
                  onChange={(e) => setProposalBar(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Час зустрічі</label>
                <input
                  type="text"
                  id="proposal-time-input"
                  value={proposalTime}
                  onChange={(e) => setProposalTime(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs"
                  required
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  id="cancel-proposal-btn"
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-semibold text-xs"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  id="submit-proposal-btn"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg transition"
                >
                  Надіслати картку зустрічі
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

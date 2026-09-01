import React, { FormEvent, useState } from 'react';
import { CreditCard, Lock } from 'lucide-react';

interface PaymentFormProps {
  amountLabel: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const luhnCheck = (num: string) => {
  const digits = num.replace(/\s/g, '');
  if (digits.length < 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
};

export const PaymentForm: React.FC<PaymentFormProps> = ({ amountLabel, onSuccess, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '').slice(0, 16);
    return v.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '').slice(0, 4);
    if (v.length >= 2) return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    return v;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const digits = cardNumber.replace(/\s/g, '');
    if (!luhnCheck(digits)) {
      onError('Enter a valid card number. Use 4242 4242 4242 4242 for this demo.');
      return;
    }
    const [mm, yy] = expiry.split('/');
    const month = Number(mm);
    if (!month || month < 1 || month > 12 || !yy) {
      onError('Enter a valid expiry date.');
      return;
    }
    if (cvc.length < 3) {
      onError('Enter a valid CVC.');
      return;
    }

    setIsProcessing(true);
    window.setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 1400);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2 rounded-xl border border-cinema-accent/30 bg-cinema-accent/10 p-3 text-sm text-rose-100">
        <Lock className="h-4 w-4" />
        Demo checkout — no real charge. Test card: 4242 4242 4242 4242
      </div>

      <div>
        <label htmlFor="name" className="mb-1 block text-sm text-zinc-300">
          Name on card
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
          placeholder="Guest User"
          required
        />
      </div>

      <div>
        <label htmlFor="cardNumber" className="mb-1 block text-sm text-zinc-300">
          Card number
        </label>
        <div className="relative">
          <input
            id="cardNumber"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            maxLength={19}
            placeholder="4242 4242 4242 4242"
            className="input-field pr-10"
            inputMode="numeric"
            required
          />
          <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-zinc-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expiry" className="mb-1 block text-sm text-zinc-300">
            Expiry
          </label>
          <input
            id="expiry"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            maxLength={5}
            placeholder="MM/YY"
            className="input-field"
            required
          />
        </div>
        <div>
          <label htmlFor="cvc" className="mb-1 block text-sm text-zinc-300">
            CVC
          </label>
          <input
            id="cvc"
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
            maxLength={3}
            placeholder="123"
            className="input-field"
            required
          />
        </div>
      </div>

      <button type="submit" disabled={isProcessing} className="btn-primary w-full">
            {isProcessing ? 'Confirming booking…' : `Pay ${amountLabel}`}
      </button>
    </form>
  );
};

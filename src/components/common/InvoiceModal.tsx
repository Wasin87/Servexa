import React from 'react';
import { Invoice } from '../../types';
import { X, Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Logo } from './Logo';

interface InvoiceModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, isOpen, onClose }) => {
  const { t, isBangla } = useLanguage();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              {t.invoice.title}
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              #{invoice.invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              {t.actions.printInvoice}
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div id="printable-invoice" className="p-6 sm:p-8 overflow-y-auto space-y-6 text-zinc-800 dark:text-zinc-200 text-sm">
          {/* Brand & Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <Logo size="lg" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Servexa Technologies Ltd. · Dhaka, Bangladesh
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Helpline: 01700-000000 · support@servexa.com
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs uppercase tracking-wider text-orange-600 dark:text-orange-400 font-bold">
                {t.invoice.kormigoHeader}
              </div>
              <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {invoice.invoiceNumber}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {t.invoice.date}: {invoice.issueDate}
              </div>
              <div className="text-xs text-zinc-500">
                বুকিং নং: {invoice.bookingNumber}
              </div>
            </div>
          </div>

          {/* Customer & Technician Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-stone-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-1">
                {t.invoice.customer}
              </div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100">
                {invoice.customerName}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                {invoice.customerPhone}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-1">
                {t.invoice.technician}
              </div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                {invoice.technicianName}
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                {invoice.technicianPhone}
              </div>
            </div>
          </div>

          {/* Table Breakdown */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <th className="py-2.5">{t.invoice.itemDescription}</th>
                  <th className="py-2.5 text-right">পরিমাণ (৳ / BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <tr>
                  <td className="py-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{invoice.serviceName}</div>
                    <div className="text-xs text-zinc-500">{t.invoice.visitingFee} (Doorstep Inspection)</div>
                  </td>
                  <td className="py-3 text-right font-medium">৳{invoice.visitingFee}</td>
                </tr>
                <tr>
                  <td className="py-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{t.invoice.labourCharge}</div>
                    <div className="text-xs text-zinc-500">কারিগরি শ্রম ও সার্ভিস চার্জ</div>
                  </td>
                  <td className="py-3 text-right font-medium">৳{invoice.labourCost}</td>
                </tr>
                {invoice.partsCost > 0 && (
                  <tr>
                    <td className="py-3">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{t.invoice.partsCharge}</div>
                      <div className="text-xs text-zinc-500">প্রয়োজনীয় স্পেয়ার পার্টস বা মালামাল</div>
                    </td>
                    <td className="py-3 text-right font-medium">৳{invoice.partsCost}</td>
                  </tr>
                )}
                {invoice.discount > 0 && (
                  <tr>
                    <td className="py-3 text-emerald-600 dark:text-emerald-400">
                      {t.invoice.discount} (প্রমোশনাল ছাড়)
                    </td>
                    <td className="py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      -৳{invoice.discount}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Total & Payment Status */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-zinc-500">{t.invoice.paymentStatus}:</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle className="w-4 h-4" />
                {t.invoice.paidNotice} ({invoice.paymentMethod.toUpperCase()})
              </span>
            </div>

            <div className="text-right w-full sm:w-auto">
              <div className="text-xs text-zinc-500">{t.invoice.total}</div>
              <div className="text-2xl font-extrabold text-orange-600 dark:text-orange-500">
                ৳{invoice.total}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800">
            {isBangla
              ? 'Servexa ব্যবহার করার জন্য ধন্যবাদ। এই ইনভয়েসটি ডিজিটালভাবে তৈরি ও অনুমোদিত।'
              : 'Thank you for choosing Servexa. This invoice is digitally generated and verified.'}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            {t.actions.close}
          </button>
        </div>
      </div>
    </div>
  );
};

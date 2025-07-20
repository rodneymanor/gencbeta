"use client";

import React from "react";
import { Icon1 } from "./icon1";

export interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  imageUrl: string;
  volume24h: string;
  volumeChange24h: string;
  price: string;
  priceChange24h: string;
  fundingRate: string;
  href: string;
}

interface CryptoTableProps {
  data: CryptoData[];
  onRowClick?: (crypto: CryptoData) => void;
  className?: string;
}

const cryptoData: CryptoData[] = [
  {
    id: "XRPUSD",
    name: "XRP",
    symbol: "XRPUSD",
    imageUrl: "https://pplx-res.cloudinary.com/image/fetch/s--ikWEcIvn--/h_50,w_50,c_fit/https://financialmodelingprep.com/image-stock/XRPUSD.png",
    volume24h: "$298.39M",
    volumeChange24h: "-72.4%",
    price: "$3.415",
    priceChange24h: "-0.91%",
    fundingRate: "0.29%",
    href: "https://www.perplexity.ai/finance/XRPUSD",
  },
  {
    id: "ETHUSD",
    name: "Ethereum",
    symbol: "ETHUSD",
    imageUrl: "https://pplx-res.cloudinary.com/image/fetch/s--neZVdw6j--/h_50,w_50,c_fit/https://financialmodelingprep.com/image-stock/ETHUSD.png",
    volume24h: "$294.94M",
    volumeChange24h: "-75.57%",
    price: "$3.6K",
    priceChange24h: "1.06%",
    fundingRate: "0.03%",
    href: "https://www.perplexity.ai/finance/ETHUSD",
  },
  {
    id: "BTCUSD",
    name: "Bitcoin",
    symbol: "BTCUSD",
    imageUrl: "https://pplx-res.cloudinary.com/image/fetch/s--oox_GDP2--/h_50,w_50,c_fit/https://financialmodelingprep.com/image-stock/BTCUSD.png",
    volume24h: "$197.81M",
    volumeChange24h: "-80.57%",
    price: "$118K",
    priceChange24h: "-0.2%",
    fundingRate: "0%",
    href: "https://www.perplexity.ai/finance/BTCUSD",
  },
  {
    id: "SOLUSD",
    name: "Solana",
    symbol: "SOLUSD",
    imageUrl: "https://pplx-res.cloudinary.com/image/fetch/s--LnSTbqn---/h_50,w_50,c_fit/https://financialmodelingprep.com/image-stock/SOLUSD.png",
    volume24h: "$197.52M",
    volumeChange24h: "-37.63%",
    price: "$177.10",
    priceChange24h: "0.08%",
    fundingRate: "0.56%",
    href: "https://www.perplexity.ai/finance/SOLUSD",
  },
  {
    id: "DOGEUSD",
    name: "Dogecoin",
    symbol: "DOGEUSD",
    imageUrl: "https://pplx-res.cloudinary.com/image/fetch/s--eabwvDeF--/h_50,w_50,c_fit/https://financialmodelingprep.com/image-stock/DOGEUSD.png",
    volume24h: "$118.51M",
    volumeChange24h: "-40.39%",
    price: "$0.242",
    priceChange24h: "1.13%",
    fundingRate: "1.65%",
    href: "https://www.perplexity.ai/finance/DOGEUSD",
  },
  {
    id: "HBARUSD",
    name: "Hedera",
    symbol: "HBARUSD",
    imageUrl: "https://pplx-res.cloudinary.com/image/fetch/s--3BiVAVA7--/h_50,w_50,c_fit/https://financialmodelingprep.com/image-stock/HBARUSD.png",
    volume24h: "$53.77M",
    volumeChange24h: "-62.3%",
    price: "$0.267",
    priceChange24h: "1.81%",
    fundingRate: "0.75%",
    href: "https://www.perplexity.ai/finance/HBARUSD",
  },
  {
    id: "BONKUSD",
    name: "Bonk",
    symbol: "BONKUSD",
    imageUrl: "https://pplx-res.cloudinary.com/image/fetch/s--hZSkYpM4--/h_50,w_50,c_fit/https://financialmodelingprep.com/image-stock/BONKUSD.png",
    volume24h: "$49.42M",
    volumeChange24h: "-49.84%",
    price: "$0.000033",
    priceChange24h: "0.55%",
    fundingRate: "3.05%",
    href: "https://www.perplexity.ai/finance/BONKUSD",
  },
  {
    id: "LTCUSD",
    name: "Litecoin",
    symbol: "LTCUSD",
    imageUrl: "https://pplx-res.cloudinary.com/image/fetch/s--Wv50Lmqe--/h_50,w_50,c_fit/https://financialmodelingprep.com/image-stock/LTCUSD.png",
    volume24h: "$48.79M",
    volumeChange24h: "-18.53%",
    price: "$111.96",
    priceChange24h: "9.8%",
    fundingRate: "0.89%",
    href: "https://www.perplexity.ai/finance/LTCUSD",
  },
  {
    id: "SUIUSD",
    name: "SUI",
    symbol: "SUIUSD",
    imageUrl: "https://pplx-res.cloudinary.com/image/fetch/s--eb4u-QRF--/h_50,w_50,c_fit/https://financialmodelingprep.com/image-stock/SUIUSD.png",
    volume24h: "$44.36M",
    volumeChange24h: "-72.74%",
    price: "$3.825",
    priceChange24h: "1.28%",
    fundingRate: "0.26%",
    href: "https://www.perplexity.ai/finance/SUIUSD",
  },
  {
    id: "PENGUUSD",
    name: "Pudgy Penguins",
    symbol: "PENGUUSD",
    imageUrl: "https://pplx-res.cloudinary.com/image/fetch/s---OIWsGpG--/h_50,w_50,c_fit/https://financialmodelingprep.com/image-stock/PENGUUSD.png",
    volume24h: "$40.15M",
    volumeChange24h: "-26.48%",
    price: "$0.031",
    priceChange24h: "0.32%",
    fundingRate: "3.18%",
    href: "https://www.perplexity.ai/finance/PENGUUSD",
  },
];

interface SortableHeaderProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

function SortableHeader({ children, active = false, onClick }: SortableHeaderProps) {
  return (
    <button
      onClick={onClick}
      className={`
        h-6 rounded-full border-0 px-2 py-0 text-xs font-medium leading-3 transition-all duration-150
        ${active 
          ? "bg-gray-100 text-slate-700" 
          : "bg-transparent text-slate-500 hover:bg-gray-50"
        }
      `}
    >
      {active && (
        <Icon1 className="mr-0.5 inline-flex h-3 w-3 align-middle text-slate-500" />
      )}
      <span className="align-middle">{children}</span>
    </button>
  );
}

function getChangeColor(value: string): string {
  if (value.startsWith("-")) {
    return "text-red-600";
  }
  if (parseFloat(value) > 0) {
    return "text-green-600";
  }
  return "text-slate-500";
}

export function CryptoTable({ 
  data = cryptoData, 
  onRowClick,
  className = ""
}: CryptoTableProps) {
  const handleRowClick = (crypto: CryptoData) => {
    if (onRowClick) {
      onRowClick(crypto);
    } else {
      window.open(crypto.href, "_blank");
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-black ${className}`}>
      <div className="overflow-hidden">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[25%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
          </colgroup>
          
          <thead>
            <tr>
              <th className="p-0"></th>
              <th className="py-1 text-center leading-4">
                <SortableHeader active>Vol 24H</SortableHeader>
              </th>
              <th className="py-1 text-center leading-4">
                <SortableHeader>Vol Chg 24H</SortableHeader>
              </th>
              <th className="py-1 text-center leading-4">
                <SortableHeader>Price</SortableHeader>
              </th>
              <th className="py-1 text-center leading-4">
                <SortableHeader>Price Chg 24H</SortableHeader>
              </th>
              <th className="py-1 pr-1 text-center leading-4">
                <SortableHeader>Funding Rate</SortableHeader>
              </th>
            </tr>
          </thead>
          
          <tbody className="h-[509px]">
            {data.map((crypto, index) => (
              <tr
                key={crypto.id}
                onClick={() => handleRowClick(crypto)}
                className="cursor-pointer border-t border-gray-200 hover:bg-gray-100"
              >
                {/* Crypto Info Cell */}
                <td className="overflow-hidden text-ellipsis whitespace-nowrap border-r border-gray-200 p-1">
                  <div className="flex w-full items-center gap-2 overflow-hidden pr-1">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center p-1">
                      <img
                        src={crypto.imageUrl}
                        alt={crypto.id}
                        className="block h-6 w-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col bg-transparent py-1">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-[18px] text-slate-700">
                        {crypto.name}
                      </div>
                      <div className="whitespace-nowrap font-mono text-xs leading-4 text-slate-500">
                        {crypto.symbol}
                      </div>
                    </div>
                  </div>
                </td>
                
                {/* Volume 24H - Highlighted */}
                <td className="border border-gray-200 bg-gray-100/30">
                  <div className="text-center text-xs font-normal leading-4 text-slate-500">
                    {crypto.volume24h}
                  </div>
                </td>
                
                {/* Volume Change 24H */}
                <td className="border border-gray-200">
                  <div className={`text-center text-xs font-normal leading-4 ${getChangeColor(crypto.volumeChange24h)}`}>
                    {crypto.volumeChange24h}
                  </div>
                </td>
                
                {/* Price */}
                <td className="border border-gray-200">
                  <div className="text-center text-xs font-normal leading-4 text-slate-500">
                    {crypto.price}
                  </div>
                </td>
                
                {/* Price Change 24H */}
                <td className="border border-gray-200">
                  <div className={`text-center text-xs font-normal leading-4 ${getChangeColor(crypto.priceChange24h)}`}>
                    {crypto.priceChange24h}
                  </div>
                </td>
                
                {/* Funding Rate */}
                <td className={`border-l border-t border-gray-200 ${index === data.length - 1 ? '' : 'border-b'}`}>
                  <div className={`text-center text-xs font-normal leading-4 ${getChangeColor(crypto.fundingRate)}`}>
                    {crypto.fundingRate}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CryptoTable;
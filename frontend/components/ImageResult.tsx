// frontend/components/ImageResult.tsx
interface Props {
  imageUrl: string;
  onReset: () => void;
}

export default function ImageResult({ imageUrl, onReset }: Props) {
  return (
    <div className="mt-6 text-center">
      <img
        src={imageUrl}
        alt="生成结果"
        className="rounded-xl max-w-full mx-auto shadow-lg"
      />
      <div className="flex gap-3 justify-center mt-4">
        <a
          href={imageUrl}
          download="ai-product-image.png"
          target="_blank"
          rel="noreferrer"
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          下载图片
        </a>
        <button
          onClick={onReset}
          className="px-5 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          重新生成
        </button>
      </div>
    </div>
  );
}

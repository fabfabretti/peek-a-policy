import React from "react";
import { Card, CardBody } from "@heroui/card";

const ScoreIndicator = ({ score, color }: { score: number; color: string }) => {
  // Dimensione massima del cerchio esterno (24x24 px, quindi 96px di diametro)
  const maxSize = 96;
  score = 80;
  // Calcolare la dimensione del cerchio interno (0 -> 10px, 100 -> 96px)
  const circleSize = (score / 100) * maxSize;

  return (
    <Card className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
      <CardBody className="relative flex items-center justify-center p-0">
        <div
          className="flex items-center justify-center"
          style={{
            width: `${circleSize}px`,
            height: `${circleSize}px`,
            borderRadius: "50%",
            backgroundColor: color, // Colore del cerchio
          }}
        >
          <i
            className="fa-solid fa-circle text-white text-4xl"
            style={{ color: "red" }}
          ></i>
        </div>
        <span className="absolute text-lg font-bold">{score}/100</span>
      </CardBody>
    </Card>
  );
};

export default ScoreIndicator;

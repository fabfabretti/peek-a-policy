import React from "react";
import { Button } from "@heroui/button";
import { useLocation, useNavigate } from "react-router";
import { Card, CardBody } from "@heroui/card";
import { Accordion, AccordionItem } from "@heroui/accordion";

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const dati = JSON.parse(new URLSearchParams(search).get("data")!);

  const indicators = [
    {
      title: "Gestione dei dati",
      score: 90,
      detail: "Spiegazione per gestione dati...",
      color: "green",
    },
    {
      title: "Trasparenza",
      score: 75,
      detail: "Spiegazione per trasparenza...",
      color: "yellow",
    },
    {
      title: "Sicurezza",
      score: 60,
      detail: "Spiegazione per sicurezza...",
      color: "red",
    },
  ];

  return (
    <div className="container mx-auto flex flex-col items-center gap-4 p-4">
      {/* Indicatore centrale compatto */}
      <Card className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
        <CardBody className="relative flex items-center justify-center p-0">
          <i className="fa-solid fa-circle text-4xl text-green-500"></i>
          <span className="absolute text-lg font-bold">85/100</span>
        </CardBody>
      </Card>

      {/* Riassunto breve */}
      <Card className="w-full max-w-md p-3">
        <h2 className="text-base font-semibold mb-1">Riassunto breve</h2>
        <p className="text-sm">
          {dati.summary || "Placeholder per il riassunto…"}
        </p>
      </Card>

      {/* Lista di indicatori con accordion compatti e pallini colorati */}
      <div className="w-full max-w-md">
        <Accordion variant="bordered" className="space-y-1">
          {indicators.map((item) => (
            <AccordionItem
              key={item.title}
              title={
                <div className="flex items-center text-sm">
                  <i
                    className={`fa-solid fa-circle mr-2 text-${
                      item.color === "green"
                        ? "green-500"
                        : item.color === "yellow"
                        ? "yellow-500"
                        : "red-500"
                    } text-xs`}
                  ></i>
                  {item.title}: {item.score}/100
                </div>
              }
              className="px-2 py-1"
            >
              <p className="text-xs p-2">{item.detail}</p>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Bottone per tornare indietro */}
      <Button
        color="primary"
        variant="solid"
        onPress={() => navigate("/")}
        className="mt-2 px-4 py-2 text-sm"
      >
        Torna Home
      </Button>
    </div>
  );
};

export default ResultPage;

{
  /* Lista di indicatori con accordion compatti e pallini colorati */
}
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
</div>;

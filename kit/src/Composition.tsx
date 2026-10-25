import { Composition } from "remotion";
import { Explainer, ExplainerProps } from "./kit/Explainer";
import showcase from "./showcase.json";
import { VIDEOS } from "./videos";

// Cada video = um JSON em src/videos/ (gerado pelo pipeline: cortes do rosto, telas, legendas, capitulos, animacoes).
export const MyComposition = () => {
  return (
    <>
      <Composition id="Vitrine" component={Explainer} durationInFrames={showcase.durationInFrames} fps={30} width={1080} height={1920}
        defaultProps={showcase as unknown as ExplainerProps} />
      {VIDEOS.map(({ id, data }) => (
        <Composition key={id} id={id} component={Explainer} durationInFrames={data.durationInFrames} fps={30} width={1080} height={1920}
          defaultProps={data as unknown as ExplainerProps} />
      ))}
    </>
  );
};

const gaussCoef = (sigma) => {
  if (sigma < 0.5) {
    sigma = 0.5;
  }

  const a = Math.exp(0.726 * 0.726) / sigma;
  const g1 = Math.exp(-a);
  const g2 = Math.exp(-2 * a);
  const k = (1 - g1) * (1 - g1) / (1 + 2 * a * g1 - g2);

  const a0 = k;
  const a1 = k * (a - 1) * g1;
  const a2 = k * (a + 1) * g1;
  const a3 = -k * g2;
  const b1 = 2 * g1;
  const b2 = -g2;
  const left_corner = (a0 + a1) / (1 - b1 - b2);
  const right_corner = (a2 + a3) / (1 - b1 - b2);

  return new Float32Array([ a0, a1, a2, a3, b1, b2, left_corner, right_corner ]);
}

const convolve = (src, out, line, coeff, width, height) => {
  let prev_src_r;
  let curr_src_r;
  let curr_out_r;
  let prev_out_r;
  let prev_prev_out_r;

  let src_index, out_index, line_index;
  let i, j;
  let coeff_a0, coeff_a1, coeff_b1, coeff_b2;

  for (i = 0; i < height; i++) {
    src_index = i * width;
    out_index = i;
    line_index = 0;

    // left to right
    prev_src_r = src[src_index];
    prev_prev_out_r = prev_src_r * coeff[6];
    prev_out_r = prev_prev_out_r;
   
    coeff_a0 = coeff[0];
    coeff_a1 = coeff[1];
    coeff_b1 = coeff[4];
    coeff_b2 = coeff[5];

    for (j = 0; j < width; j++) {
      curr_src_r = src[src_index];
      curr_out_r = curr_src_r * coeff_a0 + prev_src_r * coeff_a1 + prev_out_r * coeff_b1 + prev_prev_out_r * coeff_b2;
      prev_prev_out_r = prev_out_r;
      prev_out_r = curr_out_r;
      prev_src_r = curr_src_r;
      line[line_index] = prev_out_r;
  
      line_index++;
      src_index++;
    }

    src_index--;
    line_index--;
    out_index += height * (width - 1);

    // right to left
    prev_src_r = src[src_index];
    prev_prev_out_r = prev_src_r * coeff[7];
    prev_out_r = prev_prev_out_r;
    curr_src_r = prev_src_r;

    coeff_a0 = coeff[2];
    coeff_a1 = coeff[3];

    for (j = width - 1; j >= 0; j--) {
      curr_out_r = curr_src_r * coeff_a0 + prev_src_r * coeff_a1 + prev_out_r * coeff_b1 + prev_prev_out_r * coeff_b2;
      prev_prev_out_r = prev_out_r;
      prev_out_r = curr_out_r;
      prev_src_r = curr_src_r;
      curr_src_r = src[src_index];
      out[out_index] = line[line_index] + prev_out_r;

      src_index--;
      line_index--;
      out_index -= height;
    }
  }
}

export default (src, width, height, radius) => {
  const coeff    = gaussCoef(radius);
  const out      = new Float32Array(src.length);
  const tmp_line = new Float32Array(Math.max(width, height));

  convolve(src, out, tmp_line, coeff, width, height, radius);
  convolve(out, src, tmp_line, coeff, height, width, radius);
};

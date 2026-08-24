import pic1 from '/src/assets/images/faces-clipart/pic-1.png';
import pic2 from '/src/assets/images/faces-clipart/pic-2.png';
import pic3 from '/src/assets/images/faces-clipart/pic-3.png';
import pic4 from '/src/assets/images/faces-clipart/pic-4.png';
import PageHeader from './PageHeader';
import SearchForm from './SearchForm';
import '../styles/competencesStyle.css';
import Template from '../pages/Template';

function Body() {
  return (
    <Template>
        <div className="row">
        {/* Striped Table */}
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Recherche salaries</h4>
              <SearchForm />
              <table className="table table-striped table-competences">
                <thead>
                  <tr>
                    <th>Employe</th>
                    <th>Nom complet</th>
                    <th>Derniere mise a jour</th>
                    <th>Diplomes & formations</th>
                    <th>Competences</th>
                    <th>Langues</th>
                    <th>Autres</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1">
                      <img src={pic1} alt="image" />
                    </td>
                    <td>Herman Beck</td>
                    <td>May 15, 2015</td>
                    <td>3</td>
                    <td>7</td>
                    <td>2</td>
                    <td>0</td>
                  </tr>
                  <tr>
                    <td className="py-1">
                      <img src={pic2} alt="image" />
                    </td>
                    <td>Messsy Adam</td>
                    <td>July 1, 2015</td>
                    <td>3</td>
                    <td>4</td>
                    <td>3</td>
                    <td>2</td>
                  </tr>
                  <tr>
                    <td className="py-1">
                      <img src={pic3} alt="image" />
                    </td>
                    <td>John Richards</td>
                    <td>Apr 12, 2015</td>
                    <td>2</td>
                    <td>5</td>
                    <td>2</td>
                    <td>0</td>
                  </tr>
                  <tr>
                    <td className="py-1">
                      <img src={pic4} alt="image" />
                    </td>
                    <td>Peter Meggik</td>
                    <td>May 15, 2015</td>
                    <td>2</td>
                    <td>4</td>
                    <td>3</td>
                    <td>0</td>
                  </tr>
                  {/* Ajoutez les autres lignes ici */}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Template>
      
    
  );
}

export default Body;
